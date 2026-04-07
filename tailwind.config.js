/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#2D3FE7",
                "background-light": "#F8FAFC",
                "background-dark": "#020617",
                "surface-light": "#FFFFFF",
                "surface-dark": "#0F172A",
                "border-light": "#E2E8F0",
                "border-dark": "#1E293B",
                "text-dark": "#0F172A",
                "primary-dark": "#1e2bb0",
                "text-main": "#0F172A",
                "text-muted": "#64748B",
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Space Grotesk', 'sans-serif'],
            },
            boxShadow: {
                '3d': '6px 6px 0px 0px rgba(15, 23, 42, 1)',
                '3d-hover': '3px 3px 0px 0px rgba(15, 23, 42, 1)',
                '3d-primary': '6px 6px 0px 0px rgba(45, 63, 231, 0.4)',
            },
            backgroundImage: {
                'gradient-blue': 'linear-gradient(135deg, #2D3FE7 0%, #4F46E5 100%)',
                'gradient-subtle': 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
            },
            animation: {
                'scan': 'scan 4s linear infinite',
                'reverse-spin': 'reverse-spin 1.5s linear infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'spin-slow': 'spin 8s linear infinite',
            },
            keyframes: {
                scan: {
                    '0%': { backgroundPosition: '0 0' },
                    '100%': { backgroundPosition: '0 100%' },
                },
                'reverse-spin': {
                    from: { transform: 'rotate(360deg)' },
                    to: { transform: 'rotate(0deg)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                }
            }
        },
    },
    plugins: [],
}
