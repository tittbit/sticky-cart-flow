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

  const handleColorChange = (field: string, color: string) => {
    if (field.includes('.')) {
      const [section, property] = field.split('.');
      updateSettings({
        [section]: {
          ...settings[section as keyof typeof settings],
          [property]: color,
        }
      } as any);
    }
  };

  return (
    <Stack vertical>
      <Banner status="info">
        <p>Configure your cart drawer appearance and behavior. Changes are automatically saved.</p>
      </Banner>

      {/* Cart Drawer Settings */}
      <Card title="Cart Drawer Settings" sectioned>
        <FormLayout>
          <Switch
            label="Enable Cart Drawer"
            checked={settings.cartDrawer.enabled}
            onChange={(checked) => updateSettings({
              cartDrawer: { ...settings.cartDrawer, enabled: checked }
            })}
          />

          <FormLayout.Group>
            <Select
              label="Position"
              options={drawerPositionOptions}
              value={settings.cartDrawer.position}
              onChange={(value) => updateSettings({
                cartDrawer: { ...settings.cartDrawer, position: value as 'left' | 'right' }
              })}
            />

            <Select
              label="Theme"
              options={themeOptions}
              value={settings.cartDrawer.theme}
              onChange={(value) => updateSettings({
                cartDrawer: { ...settings.cartDrawer, theme: value as 'light' | 'dark' | 'auto' }
              })}
            />
          </FormLayout.Group>

          <FormLayout.Group>
            <Switch
              label="Show on Desktop"
              checked={settings.cartDrawer.showOnDesktop}
              onChange={(checked) => updateSettings({
                cartDrawer: { ...settings.cartDrawer, showOnDesktop: checked }
              })}
            />

            <Switch
              label="Show on Mobile"
              checked={settings.cartDrawer.showOnMobile}
              onChange={(checked) => updateSettings({
                cartDrawer: { ...settings.cartDrawer, showOnMobile: checked }
              })}
            />
          </FormLayout.Group>

          <Select
            label="Animation"
            options={animationOptions}
            value={settings.cartDrawer.animation}
            onChange={(value) => updateSettings({
              cartDrawer: { ...settings.cartDrawer, animation: value as 'slide' | 'fade' | 'scale' }
            })}
          />

          <Switch
            label="Auto Open Cart"
            checked={settings.cartDrawer.autoOpen}
            onChange={(checked) => updateSettings({
              cartDrawer: { ...settings.cartDrawer, autoOpen: checked }
            })}
            helpText="Automatically open cart when items are added"
          />

          <Switch
            label="Backdrop Blur"
            checked={settings.cartDrawer.backdropBlur}
            onChange={(checked) => updateSettings({
              cartDrawer: { ...settings.cartDrawer, backdropBlur: checked }
            })}
          />
        </FormLayout>
      </Card>

      {/* Sticky Button Settings */}
      <Card title="Sticky Cart Button Settings" sectioned>
        <FormLayout>
          <Switch
            label="Enable Sticky Button"
            checked={settings.stickyButton.enabled}
            onChange={(checked) => updateSettings({
              stickyButton: { ...settings.stickyButton, enabled: checked }
            })}
          />

          <FormLayout.Group>
            <TextField
              label="Button Text"
              value={settings.stickyButton.text}
              onChange={(value) => updateSettings({
                stickyButton: { ...settings.stickyButton, text: value }
              })}
              autoComplete="off"
            />

            <Select
              label="Position"
              options={positionOptions}
              value={settings.stickyButton.position}
              onChange={(value) => updateSettings({
                stickyButton: { ...settings.stickyButton, position: value as any }
              })}
            />
          </FormLayout.Group>

          <FormLayout.Group>
            <Select
              label="Icon"
              options={iconOptions}
              value={settings.stickyButton.icon}
              onChange={(value) => updateSettings({
                stickyButton: { ...settings.stickyButton, icon: value as 'cart' | 'bag' | 'basket' }
              })}
            />

            <Select
              label="Size"
              options={sizeOptions}
              value={settings.stickyButton.size}
              onChange={(value) => updateSettings({
                stickyButton: { ...settings.stickyButton, size: value as 'sm' | 'md' | 'lg' }
              })}
            />
          </FormLayout.Group>

          <FormLayout.Group>
            <Switch
              label="Show Item Count"
              checked={settings.stickyButton.showCount}
              onChange={(checked) => updateSettings({
                stickyButton: { ...settings.stickyButton, showCount: checked }
              })}
            />

            <Switch
              label="Show Cart Total"
              checked={settings.stickyButton.showPrice}
              onChange={(checked) => updateSettings({
                stickyButton: { ...settings.stickyButton, showPrice: checked }
              })}
            />
          </FormLayout.Group>

          <Select
            label="Animation"
            options={buttonAnimationOptions}
            value={settings.stickyButton.animation}
            onChange={(value) => updateSettings({
              stickyButton: { ...settings.stickyButton, animation: value as any }
            })}
          />

          <div>
            <label>Button Color</label>
            <ColorPicker
              color={hexToHsb(settings.stickyButton.color)}
              onChange={(color) => handleColorChange('stickyButton.color', color)}
            />
          </div>
        </FormLayout>
      </Card>

      {/* Free Shipping Settings */}
      <Card title="Free Shipping Progress" sectioned>
        <FormLayout>
          <Switch
            label="Enable Free Shipping Progress"
            checked={settings.freeShipping.enabled}
            onChange={(checked) => updateSettings({
              freeShipping: { ...settings.freeShipping, enabled: checked }
            })}
          />

          <FormLayout.Group>
            <TextField
              label="Free Shipping Threshold"
              value={settings.freeShipping.threshold.toString()}
              onChange={(value) => updateSettings({
                freeShipping: { ...settings.freeShipping, threshold: parseFloat(value) || 0 }
              })}
              type="number"
              prefix="$"
              autoComplete="off"
            />

            <TextField
              label="Currency"
              value={settings.freeShipping.currency}
              onChange={(value) => updateSettings({
                freeShipping: { ...settings.freeShipping, currency: value }
              })}
              autoComplete="off"
            />
          </FormLayout.Group>

          <TextField
            label="Progress Message"
            value={settings.freeShipping.message}
            onChange={(value) => updateSettings({
              freeShipping: { ...settings.freeShipping, message: value }
            })}
            helpText="Use variables: {amount} for remaining amount, {total} for threshold"
            autoComplete="off"
          />

          <Switch
            label="Show Progress Bar"
            checked={settings.freeShipping.progressBar}
            onChange={(checked) => updateSettings({
              freeShipping: { ...settings.freeShipping, progressBar: checked }
            })}
          />
        </FormLayout>
      </Card>

      {/* Design Settings */}
      <Card title="Design & Colors" sectioned>
        <FormLayout>
          <div>
            <label>Primary Color</label>
            <ColorPicker
              color={hexToHsb(settings.design.primaryColor)}
              onChange={(color) => handleColorChange('design.primaryColor', color)}
            />
          </div>

          <div>
            <label>Secondary Color</label>
            <ColorPicker
              color={hexToHsb(settings.design.secondaryColor)}
              onChange={(color) => handleColorChange('design.secondaryColor', color)}
            />
          </div>

          <div>
            <label>Border Radius</label>
            <RangeSlider
              label="Border Radius"
              value={settings.design.borderRadius}
              onChange={(value) => updateSettings({
                design: { ...settings.design, borderRadius: value }
              })}
              min={0}
              max={20}
              step={1}
              suffix={`${settings.design.borderRadius}px`}
            />
          </div>

          <TextField
            label="Font Family"
            value={settings.design.fontFamily}
            onChange={(value) => updateSettings({
              design: { ...settings.design, fontFamily: value }
            })}
            helpText="Enter a Google Font name or system font"
            autoComplete="off"
          />
        </FormLayout>
      </Card>
    </Stack>
  );
};