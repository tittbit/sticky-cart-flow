import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const shopDomain = url.searchParams.get('shop') || 'default-shop.myshopify.com';

    if (req.method === 'POST') {
      // Track analytics event
      const { event_type, session_id, cart_total, item_count, product_id, variant_id, event_data } = await req.json();
      
      const userAgent = req.headers.get('user-agent') || '';

      // Insert analytics event
      const { error: analyticsError } = await supabaseClient
        .from('cart_analytics')
        .insert({
          shop_domain: shopDomain,
          event_type,
          session_id,
          cart_total,
          item_count,
          product_id,
          variant_id,
          event_data,
          user_agent: userAgent
        });

      if (analyticsError) {
        console.error('Error inserting analytics:', analyticsError);
        throw analyticsError;
      }

      // Update monthly usage stats
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'; // First day of current month
      
      let updateData: any = {};
      switch (event_type) {
        case 'cart_open':
          updateData.cart_opens = 1;
          break;
        case 'checkout_click':
          updateData.conversions = 1;
          if (cart_total) updateData.revenue_generated = cart_total;
          break;
      }

      if (Object.keys(updateData).length > 0) {
        // Use PostgreSQL's ON CONFLICT with increment
        const { error: usageError } = await supabaseClient.rpc('increment_usage', {
          shop_domain_param: shopDomain,
          month_param: currentMonth,
          cart_opens_increment: updateData.cart_opens || 0,
          conversions_increment: updateData.conversions || 0,
          revenue_increment: updateData.revenue_generated || 0
        });

        if (usageError) {
          console.error('Error updating usage:', usageError);
          // Don't throw here, analytics event was still recorded
        }
      }

      console.log('Analytics event tracked:', event_type, 'for shop:', shopDomain);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET') {
      // Get analytics data
      const days = parseInt(url.searchParams.get('days') || '30');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get recent analytics
      const { data: events, error: eventsError } = await supabaseClient
        .from('cart_analytics')
        .select('*')
        .eq('shop_domain', shopDomain)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        throw eventsError;
      }

      // Get monthly usage stats
      const { data: usage, error: usageError } = await supabaseClient
        .from('subscription_usage')
        .select('*')
        .eq('shop_domain', shopDomain)
        .gte('month', startDate.toISOString().slice(0, 7) + '-01')
        .order('month', { ascending: false });

      if (usageError) {
        console.error('Error fetching usage:', usageError);
        throw usageError;
      }

      // Calculate summary stats
      const cartOpens = events?.filter(e => e.event_type === 'cart_open').length || 0;
      const conversions = events?.filter(e => e.event_type === 'checkout_click').length || 0;
      const conversionRate = cartOpens > 0 ? (conversions / cartOpens * 100) : 0;
      const avgOrderValue = conversions > 0 ? 
        events?.filter(e => e.event_type === 'checkout_click' && e.cart_total)
               .reduce((sum, e) => sum + (e.cart_total || 0), 0) / conversions : 0;

      const summary = {
        cart_opens: cartOpens,
        conversions: conversions,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        avg_order_value: Math.round(avgOrderValue * 100) / 100,
        abandonment_rate: cartOpens > 0 ? Math.round((1 - conversionRate / 100) * 10000) / 100 : 0
      };

      return new Response(JSON.stringify({
        summary,
        events: events || [],
        monthly_usage: usage || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analytics function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});