export const STRINGS = {
    common: {
        appName: "GraNa-GraNo",
        year: "2026"
    },
    documentation: {
        mainUrl: "https://dmki-tuwien.github.io/grana-grano",
    },
    // auth: {
    //     signIn: "Sign In",
    //     signOut: "Sign Out",
    //     welcome: (name: string) => `Welcome back, ${name}!`,
    // },
    navbar: {
        logs: "Show logs",
        reset: "Restart",
        resetTooltip: "Restart GraNa-GraNo, and clean up Neo4j, and Memgraph.",
    },
    errors: {
        generic: "Something went wrong. Please try again.",
        notFound: "Page not found.",
    },
} as const;
