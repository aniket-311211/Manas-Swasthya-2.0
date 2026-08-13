const tailwindcssAnimate = require("tailwindcss-animate");

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            fontFamily: {
                display: ["'Playfair Display Variable'", "Georgia", "serif"],
                body: ["'Inter Variable'", "system-ui", "sans-serif"],
            },
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                sage: {
                    DEFAULT: "hsl(var(--sage))",
                    deep: "hsl(var(--sage-deep))",
                },
                lavender: "hsl(var(--lavender))",
                clay: "hsl(var(--clay))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                    light: "hsl(var(--primary-light))",
                    dark: "hsl(var(--primary-dark))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                therapeutic: {
                    blue: "hsl(var(--therapeutic-blue))",
                    green: "hsl(var(--therapeutic-green))",
                    purple: "hsl(var(--therapeutic-purple))",
                    warm: "hsl(var(--therapeutic-warm))",
                },
                success: {
                    DEFAULT: "hsl(var(--success))",
                    foreground: "hsl(var(--success-foreground))",
                },
                warning: {
                    DEFAULT: "hsl(var(--warning))",
                    foreground: "hsl(var(--warning-foreground))",
                },
                sidebar: {
                    DEFAULT: "hsl(var(--sidebar-background))",
                    foreground: "hsl(var(--sidebar-foreground))",
                    primary: "hsl(var(--sidebar-primary))",
                    "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
                    accent: "hsl(var(--sidebar-accent))",
                    "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
                    border: "hsl(var(--sidebar-border))",
                    ring: "hsl(var(--sidebar-ring))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            boxShadow: {
                soft: "var(--shadow-soft)",
                lift: "var(--shadow-lift)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                drift1: {
                    "0%, 100%": { transform: "translate(0,0) scale(1)" },
                    "50%": { transform: "translate(40px,-25px) scale(1.15)" },
                },
                drift2: {
                    "0%, 100%": { transform: "translate(0,0) scale(1.1)" },
                    "50%": { transform: "translate(-35px,20px) scale(0.95)" },
                },
                drift3: {
                    "0%, 100%": { transform: "translate(0,0) scale(1)" },
                    "50%": { transform: "translate(25px,30px) scale(1.2)" },
                },
                floaty: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                fadeUp: {
                    from: { opacity: "0", transform: "translateY(16px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                pulseDot: {
                    "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
                    "50%": { opacity: "1", transform: "scale(1.6)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                drift1: "drift1 9s ease-in-out infinite",
                drift2: "drift2 11s ease-in-out infinite",
                drift3: "drift3 13s ease-in-out infinite",
                floaty: "floaty 6s ease-in-out infinite",
                "fade-up": "fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both",
                "pulse-dot": "pulseDot 2.5s ease-in-out infinite",
            },
        },
    },
    plugins: [tailwindcssAnimate],
};
