import React from 'react';
import { Settings, BarChart3, Plus, Zap, Home } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const items = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'General Settings', url: '/settings/general', icon: Settings },
  { title: 'Upsells', url: '/settings/upsells', icon: Zap },
  { title: 'Add-Ons', url: '/settings/addons', icon: Plus },
  { title: 'Analytics', url: '/settings/analytics', icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) =>
    isActive(path) ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Cart Drawer App</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {state !== 'collapsed' && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}