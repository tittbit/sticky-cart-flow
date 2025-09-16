import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shopDomain = url.searchParams.get('shop') || req.headers.get('x-shop-domain');
    
    if (!shopDomain) {
      return new Response(JSON.stringify({ error: 'Shop domain is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      // Track analytics event
      const { eventType, sessionId, cartTotal, itemCount, productId, variantId, eventData } = await req.json();
      
      if (!eventType) {
        return new Response(JSON.stringify({ error: 'Event type is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Insert analytics event
      const { error: analyticsError } = await supabase
        .from('cart_analytics')
        .insert({
          shop_domain: shopDomain,
          event_type: eventType,
          session_id: sessionId,
          cart_total: cartTotal,
          item_count: itemCount,
          product_id: productId,
          variant_id: variantId,
          event_data: eventData || {},
          user_agent: req.headers.get('user-agent')
        });

      if (analyticsError) {
        console.error('Error tracking analytics:', analyticsError);
        return new Response(JSON.stringify({ error: 'Failed to track analytics' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update monthly usage statistics
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'; // YYYY-MM-01
      
      let updateData: any = {};
      if (eventType === 'cart_open') {
        updateData.cart_opens = 1;
      } else if (eventType === 'checkout_click') {
        updateData.conversions = 1;
        updateData.orders_processed = 1;
        updateData.revenue_generated = cartTotal || 0;
      }

      if (Object.keys(updateData).length > 0) {
        // Use SQL function to increment counters
        const { error: usageError } = await supabase.rpc('increment_usage_stats', {
          p_shop_domain: shopDomain,
          p_month: currentMonth,
          p_cart_opens: updateData.cart_opens || 0,
          p_conversions: updateData.conversions || 0,
          p_orders_processed: updateData.orders_processed || 0,
          p_revenue_generated: updateData.revenue_generated || 0
        });

        if (usageError) {
          console.error('Error updating usage stats:', usageError);
        }
      }

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
      const { data: analytics, error } = await supabase
        .from('cart_analytics')
        .select('*')
        .eq('shop_domain', shopDomain)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching analytics:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch analytics' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Calculate metrics
      const cartOpens = analytics?.filter(a => a.event_type === 'cart_open').length || 0;
      const conversions = analytics?.filter(a => a.event_type === 'checkout_click').length || 0;
      const conversionRate = cartOpens > 0 ? (conversions / cartOpens * 100).toFixed(1) : '0';
      
      const totalRevenue = analytics
        ?.filter(a => a.event_type === 'checkout_click' && a.cart_total)
        .reduce((sum, a) => sum + parseFloat(a.cart_total || '0'), 0) || 0;
      
      const avgOrderValue = conversions > 0 ? (totalRevenue / conversions).toFixed(2) : '0';

      // Get monthly usage data
      const { data: monthlyUsage, error: usageError } = await supabase
        .from('subscription_usage')
        .select('*')
        .eq('shop_domain', shopDomain)
        .order('month', { ascending: false })
        .limit(6);

      return new Response(JSON.stringify({
        success: true,
        metrics: {
          cartOpens,
          conversions,
          conversionRate: parseFloat(conversionRate),
          totalRevenue,
          avgOrderValue: parseFloat(avgOrderValue),
          abandonment: cartOpens > 0 ? ((cartOpens - conversions) / cartOpens * 100).toFixed(1) : '0'
        },
        monthlyUsage: monthlyUsage || [],
        recentEvents: analytics?.slice(0, 100) || []
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
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
