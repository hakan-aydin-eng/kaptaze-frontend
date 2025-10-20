const { withDangerousMod, withPlugins } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * This plugin creates a custom Podfile that fixes Firebase modular header issues
 */
const withPodfileModifier = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const podfilePath = path.join(projectRoot, 'ios', 'Podfile');

      // Create ios directory if it doesn't exist
      const iosPath = path.join(projectRoot, 'ios');
      if (!fs.existsSync(iosPath)) {
        fs.mkdirSync(iosPath, { recursive: true });
      }

      // Create a Podfile with Firebase fixes
      const podfileContent = `require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

platform :ios, '13.4'
install! 'cocoapods', :deterministic_uuids => false

# Force static frameworks
use_frameworks! :linkage => :static

# Disable Flipper
flipper_enabled = false

target 'KapTaze' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true,
    :fabric_enabled => false,
    :flipper_configuration => flipper_enabled ? FlipperConfiguration.enabled : FlipperConfiguration.disabled,
    :app_path => "#{Pod::Config.instance.installation_root}/.."
  )

  # Firebase pods - explicitly configure
  pod 'Firebase/Core'
  pod 'Firebase/Messaging'

  # Fix for Firebase
  pod 'React-Core', :modular_headers => true
  pod 'React-Core/RCTWebSocket', :modular_headers => true

  post_install do |installer|
    react_native_post_install(installer)

    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        # Disable all warnings being treated as errors
        config.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO'
        config.build_settings['CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER'] = 'NO'

        # Allow non-modular includes
        if target.name == 'RNFBApp'
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
          config.build_settings['OTHER_CFLAGS'] = '$(inherited) -Wno-error=non-modular-include-in-framework-module'
        end
      end
    end

    # Fix for all pods globally
    installer.pods_project.build_configurations.each do |config|
      config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      config.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO'
    end

    __apply_Xcode_12_5_M1_post_install_workaround(installer)
  end
end

def __apply_Xcode_12_5_M1_post_install_workaround(installer)
  installer.pods_project.build_configurations.each do |config|
    config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.4'
  end
end
`;

      fs.writeFileSync(podfilePath, podfileContent);
      console.log('✅ Custom Podfile created with Firebase fixes');

      return config;
    }
  ]);
};

module.exports = withPodfileModifier;