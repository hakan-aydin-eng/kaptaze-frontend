const { withPodfile } = require('@expo/config-plugins');

/**
 * Custom Expo config plugin to fix Firebase modular header warnings
 * This adds a post_install hook to the Podfile that disables the warning
 */
const withFirebaseModularHeaders = (config) => {
  return withPodfile(config, async (config) => {
    const contents = config.modResults.contents;

    // Check if we've already added this fix
    if (contents.includes('CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER')) {
      return config;
    }

    // Add post_install hook to disable the warning
    const postInstallHook = `
  post_install do |installer|
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        # Disable modular header warnings for Firebase
        config.build_settings['CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER'] = 'NO'
      end
    end
  end
`;

    // Append the post_install hook before the final 'end'
    const modifiedContents = contents.replace(/^end\s*$/m, `${postInstallHook}\nend`);
    config.modResults.contents = modifiedContents;

    return config;
  });
};

module.exports = withFirebaseModularHeaders;
