export const LIST_ITEM_SLOTS = {
  standard: {
    primary: {variant: 'subtitle1' as const},
    secondary: {color: 'text.secondary' as const, variant: 'body2' as const},
  },
  nested: {
    primary: {variant: 'body2' as const, sx: {lineHeight: 1.3}},
  },
  detail: {
    primary: {variant: 'body2' as const, sx: {lineHeight: 1.3}},
    secondary: {
      color: 'text.secondary' as const,
      variant: 'caption' as const,
      sx: {lineHeight: 1.2},
    },
  },
  collapsible: {
    primary: {variant: 'subtitle1' as const},
    secondary: {color: 'text.secondary' as const, variant: 'body2' as const},
  },
} as const;
