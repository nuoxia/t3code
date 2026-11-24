// Set by boot from packaged metadata before any desktop services load.
export const isDesktopTrial = () => process.env.T3CODE_DESKTOP_TRIAL === "1";
