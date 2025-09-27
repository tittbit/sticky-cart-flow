import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSettings } from '@/contexts/SettingsContext';

export const GeneralSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  const positionOptions = [
    { label: 'Bottom Right', value: 'bottom-right' },
    { label: 'Bottom Left', value: 'bottom-left' },
    { label: 'Top Right', value: 'top-right' },
    { label: 'Top Left', value: 'top-left' },
  ];

  const drawerPositionOptions = [
    { label: 'Right', value: 'right' },
    { label: 'Left', value: 'left' },
  ];

  const themeOptions = [
    { label: 'Auto', value: 'auto' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ];

  const animationOptions = [
    { label: 'Slide', value: 'slide' },
    { label: 'Fade', value: 'fade' },
    { label: 'Scale', value: 'scale' },
  ];

  const iconOptions = [
    { label: 'Cart', value: 'cart' },
    { label: 'Bag', value: 'bag' },
    { label: 'Basket', value: 'basket' },
  ];

  const sizeOptions = [
    { label: 'Small', value: 'sm' },
    { label: 'Medium', value: 'md' },
    { label: 'Large', value: 'lg' },
  ];

  const buttonAnimationOptions = [
    { label: 'None', value: 'none' },
    { label: 'Bounce', value: 'bounce' },
    { label: 'Pulse', value: 'pulse' },
    { label: 'Shake', value: 'shake' },
  ];

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          Configure your cart drawer appearance and behavior. Changes are automatically saved.
        </AlertDescription>
      </Alert>

      {/* Cart Drawer Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Cart Drawer Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.cartDrawer.enabled}
              onCheckedChange={(checked) => updateSettings({
                cartDrawer: { ...settings.cartDrawer, enabled: checked }
              })}
            />
            <Label>Enable Cart Drawer</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Position</Label>
              <Select
                value={settings.cartDrawer.position}
                onValueChange={(value) => updateSettings({
                  cartDrawer: { ...settings.cartDrawer, position: value as 'left' | 'right' }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {drawerPositionOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={settings.cartDrawer.theme}
                onValueChange={(value) => updateSettings({
                  cartDrawer: { ...settings.cartDrawer, theme: value as 'light' | 'dark' | 'auto' }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.cartDrawer.showOnDesktop}
                onCheckedChange={(checked) => updateSettings({
                  cartDrawer: { ...settings.cartDrawer, showOnDesktop: checked }
                })}
              />
              <Label>Show on Desktop</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.cartDrawer.showOnMobile}
                onCheckedChange={(checked) => updateSettings({
                  cartDrawer: { ...settings.cartDrawer, showOnMobile: checked }
                })}
              />
              <Label>Show on Mobile</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Animation</Label>
            <Select
              value={settings.cartDrawer.animation}
              onValueChange={(value) => updateSettings({
                cartDrawer: { ...settings.cartDrawer, animation: value as 'slide' | 'fade' | 'scale' }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {animationOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.cartDrawer.autoOpen}
                onCheckedChange={(checked) => updateSettings({
                  cartDrawer: { ...settings.cartDrawer, autoOpen: checked }
                })}
              />
              <Label>Auto Open Cart</Label>
            </div>
            <p className="text-sm text-muted-foreground">Automatically open cart when items are added</p>

            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.cartDrawer.backdropBlur}
                onCheckedChange={(checked) => updateSettings({
                  cartDrawer: { ...settings.cartDrawer, backdropBlur: checked }
                })}
              />
              <Label>Backdrop Blur</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sticky Button Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Sticky Cart Button Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.stickyButton.enabled}
              onCheckedChange={(checked) => updateSettings({
                stickyButton: { ...settings.stickyButton, enabled: checked }
              })}
            />
            <Label>Enable Sticky Button</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="button-text">Button Text</Label>
              <Input
                id="button-text"
                value={settings.stickyButton.text}
                onChange={(e) => updateSettings({
                  stickyButton: { ...settings.stickyButton, text: e.target.value }
                })}
              />
            </div>

            <div className="space-y-2">
              <Label>Position</Label>
              <Select
                value={settings.stickyButton.position}
                onValueChange={(value) => updateSettings({
                  stickyButton: { ...settings.stickyButton, position: value as any }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {positionOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select
                value={settings.stickyButton.icon}
                onValueChange={(value) => updateSettings({
                  stickyButton: { ...settings.stickyButton, icon: value as 'cart' | 'bag' | 'basket' }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Size</Label>
              <Select
                value={settings.stickyButton.size}
                onValueChange={(value) => updateSettings({
                  stickyButton: { ...settings.stickyButton, size: value as 'sm' | 'md' | 'lg' }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sizeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.stickyButton.showCount}
                onCheckedChange={(checked) => updateSettings({
                  stickyButton: { ...settings.stickyButton, showCount: checked }
                })}
              />
              <Label>Show Item Count</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.stickyButton.showPrice}
                onCheckedChange={(checked) => updateSettings({
                  stickyButton: { ...settings.stickyButton, showPrice: checked }
                })}
              />
              <Label>Show Cart Total</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Animation</Label>
            <Select
              value={settings.stickyButton.animation}
              onValueChange={(value) => updateSettings({
                stickyButton: { ...settings.stickyButton, animation: value as any }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {buttonAnimationOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="button-color">Button Color</Label>
            <Input
              id="button-color"
              type="color"
              value={settings.stickyButton.color}
              onChange={(e) => updateSettings({
                stickyButton: { ...settings.stickyButton, color: e.target.value }
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Free Shipping Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Free Shipping Progress</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.freeShipping.enabled}
              onCheckedChange={(checked) => updateSettings({
                freeShipping: { ...settings.freeShipping, enabled: checked }
              })}
            />
            <Label>Enable Free Shipping Progress</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="threshold">Free Shipping Threshold</Label>
              <Input
                id="threshold"
                type="number"
                value={settings.freeShipping.threshold}
                onChange={(e) => updateSettings({
                  freeShipping: { ...settings.freeShipping, threshold: parseFloat(e.target.value) || 0 }
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={settings.freeShipping.currency}
                onChange={(e) => updateSettings({
                  freeShipping: { ...settings.freeShipping, currency: e.target.value }
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Progress Message</Label>
            <Input
              id="message"
              value={settings.freeShipping.message}
              onChange={(e) => updateSettings({
                freeShipping: { ...settings.freeShipping, message: e.target.value }
              })}
            />
            <p className="text-sm text-muted-foreground">Use variables: {'{amount}'} for remaining amount, {'{total}'} for threshold</p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.freeShipping.progressBar}
              onCheckedChange={(checked) => updateSettings({
                freeShipping: { ...settings.freeShipping, progressBar: checked }
              })}
            />
            <Label>Show Progress Bar</Label>
          </div>
        </CardContent>
      </Card>

      {/* Design Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Design & Colors</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <Input
                id="primary-color"
                type="color"
                value={settings.design.primaryColor}
                onChange={(e) => updateSettings({
                  design: { ...settings.design, primaryColor: e.target.value }
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <Input
                id="secondary-color"
                type="color"
                value={settings.design.secondaryColor}
                onChange={(e) => updateSettings({
                  design: { ...settings.design, secondaryColor: e.target.value }
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="border-radius">Border Radius: {settings.design.borderRadius}px</Label>
            <Slider
              value={[settings.design.borderRadius]}
              onValueChange={([value]) => updateSettings({
                design: { ...settings.design, borderRadius: value }
              })}
              max={20}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-family">Font Family</Label>
            <Input
              id="font-family"
              value={settings.design.fontFamily}
              onChange={(e) => updateSettings({
                design: { ...settings.design, fontFamily: e.target.value }
              })}
              placeholder="Enter a Google Font name or system font"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};