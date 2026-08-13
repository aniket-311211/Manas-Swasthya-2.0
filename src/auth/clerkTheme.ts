/**
 * How Clerk's hosted components are dressed to match the rest of the site.
 *
 * Kept out of AuthLayout.tsx so that file exports a component and nothing else
 * — mixing constants in breaks Fast Refresh for the whole module.
 */

export const AUTH_FIELD = '#1f9d8f';

/**
 * Clerk's own class hooks. Kept in one place so the two pages cannot drift, and
 * so the card matches the site rather than Clerk's defaults: Playfair for the
 * title, fully rounded controls, brand teal for the primary action.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: '#12665e',
    colorText: '#12211F',
    colorTextSecondary: '#4A6866',
    colorDanger: '#8B1111',
    borderRadius: '0.75rem',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  elements: {
    // The page already has a card; Clerk must not draw a second one inside it.
    rootBox: 'w-full',
    cardBox: 'shadow-none border-0 w-full',
    card: 'shadow-none border-0 bg-transparent p-0 w-full',
    header: 'text-center',
    headerTitle: "font-['Playfair_Display_Variable',_serif] text-[24px] text-[#12211F]",
    headerSubtitle: 'text-[14px] text-[#4A6866]',
    socialButtonsBlockButton:
      'rounded-full border border-[#12211F]/15 hover:bg-[#1f9d8f]/8 transition-colors',
    socialButtonsBlockButtonText: 'font-medium text-[#12211F]',
    dividerLine: 'bg-[#12211F]/10',
    dividerText: 'text-[#4A6866]',
    formFieldLabel: 'text-[13px] font-semibold text-[#12211F]',
    formFieldInput:
      'rounded-full border-[#12211F]/15 focus:border-[#12665e] focus:ring-2 focus:ring-[#12665e]/30',
    formButtonPrimary:
      'rounded-full bg-[#12665e] hover:bg-[#0e514a] text-white font-semibold normal-case text-[14px] shadow-none',
    footerActionLink: 'text-[#12665e] hover:text-[#0e514a] font-semibold',
    identityPreviewEditButton: 'text-[#12665e]',
    formResendCodeLink: 'text-[#12665e]',
    // Clerk renders its own "Secured by Clerk" footer; the badge stays (it is
    // part of their terms) but the development-mode strip is noise in a
    // screenshot, not something to hide in production.
    footer: 'bg-transparent',
  },
} as const;
