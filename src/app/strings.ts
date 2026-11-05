export const STRINGS = {
    alert: {
        errorButton: "Reload the page",
    },
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
    logs: {
        dialogClose: "Close",
        dialogTitle: "Logs",
        filterPlaceholder: "Filter log levels…",
    },
    navbar: {
        documentation: "Open documentation",
        logs: "Logs",
        reset: "Restart",
        resetTooltip: "Restart GraNa-GraNo, and clean up Neo4j, and Memgraph.",
        settings: "Settings",
    },
    onboarding: {
        welcomeShort: "Welcome",
        welcomeLong: "Welcome to GraNa-GraNo!",
        loadScenario: "Load scenario",
        graphStoreLabel: "Choose a graph store:",
        scenarioType: "Select how you want to define a normalization scenario:",
        scenarioShort: "Scenario",
    },
    settings: {
        dialogClose: "Close",
        dialogTitle: "Settings",
        llmApiEndpoint: "OpenAI-compatible endpoint API URL",
        llmApiToken: "API Token",
        llmApiModel: "Model name",
        useLLMs: "Use LLMs to determine fresh labels",
    },
    errors: {
        generic: "Something went wrong. Please try again.",
        notFound: "Page not found.",
    },
} as const;
