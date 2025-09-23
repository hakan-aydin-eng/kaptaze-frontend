import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
  PanResponder,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const StoryModal = ({
  visible,
  story,
  onClose,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious
}) => {
  const [progressAnim] = useState(new Animated.Value(0));
  const [paused, setPaused] = useState(false);
  const [navigationDisabled, setNavigationDisabled] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false); // User manually paused

  useEffect(() => {
    if (visible && !paused) {
      startProgress();
    }

    return () => {
      progressAnim.setValue(0);
    };
  }, [visible, paused]);

  // Reset user pause state when story changes
  useEffect(() => {
    setIsUserPaused(false);
    setPaused(false);
  }, [story]);

  const startProgress = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000, // 5 seconds per story
      useNativeDriver: false,
    }).start((finished) => {
      if (finished && hasNext && !navigationDisabled) {
        console.log('⏰ Auto-progress completing, going to next story');
        onNext();
      } else if (finished && !navigationDisabled) {
        console.log('⏰ Auto-progress completing, closing modal');
        onClose();
      } else if (finished && navigationDisabled) {
        console.log('⏰ Auto-progress finished but navigation is disabled');
      }
    });
  };

  const pauseProgress = () => {
    setPaused(true);
    progressAnim.stopAnimation();
  };

  const resumeProgress = () => {
    setPaused(false);
    const currentProgress = progressAnim._value;
    const remainingTime = (1 - currentProgress) * 5000;

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingTime,
      useNativeDriver: false,
    }).start((finished) => {
      if (finished && hasNext && !navigationDisabled) {
        console.log('⏰ Resume-progress completing, going to next story');
        onNext();
      } else if (finished && !navigationDisabled) {
        console.log('⏰ Resume-progress completing, closing modal');
        onClose();
      } else if (finished && navigationDisabled) {
        console.log('⏰ Resume-progress finished but navigation is disabled');
      }
    });
  };

  // Pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 20 || Math.abs(gestureState.dy) > 20;
    },
    onPanResponderMove: (evt, gestureState) => {
      // Pause progress during gesture
      if (!paused) {
        pauseProgress();
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx, dy } = gestureState;

      // Resume progress
      if (paused) {
        resumeProgress();
      }

      // Prevent swipe navigation if tap navigation is disabled
      if (navigationDisabled) {
        console.log('⏳ Navigation disabled, ignoring swipe');
        return;
      }

      // Swipe left - next story
      if (dx < -50 && Math.abs(dx) > Math.abs(dy)) {
        console.log('👈 Swipe left detected');
        // Apply same navigation delay for swipes
        setNavigationDisabled(true);
        setTimeout(() => setNavigationDisabled(false), 1000);

        if (hasNext) {
          onNext();
        } else {
          onClose();
        }
      }
      // Swipe right - previous story
      else if (dx > 50 && Math.abs(dx) > Math.abs(dy)) {
        console.log('👉 Swipe right detected');
        // Apply same navigation delay for swipes
        setNavigationDisabled(true);
        setTimeout(() => setNavigationDisabled(false), 1000);

        if (hasPrevious) {
          onPrevious();
        }
      }
      // Swipe down - close modal
      else if (dy > 50 && Math.abs(dy) > Math.abs(dx)) {
        console.log('👇 Swipe down detected - closing');
        onClose();
      }
    },
  });

  const handleTapPress = (event) => {
    if (navigationDisabled) {
      console.log('⏳ Navigation disabled, ignoring tap');
      return;
    }

    const tapX = event.nativeEvent.locationX;
    const screenCenter = width / 2;

    console.log('👆 Story tap detected at X:', tapX, 'Screen center:', screenCenter);
    console.log('🎬 Current state - paused:', paused, 'userPaused:', isUserPaused);

    // Instagram-like behavior: First tap pauses, second tap navigates
    if (!paused && !isUserPaused) {
      // First tap: Just pause to let user view the story
      console.log('⏸️ First tap: Pausing story for viewing');
      pauseProgress();
      setIsUserPaused(true);

      // Show a visual hint that story is paused
      // User can tap again to navigate
      return;
    }

    // Second tap or already paused: Navigate
    console.log('▶️ Second tap: Navigating');

    // Disable navigation for 1.5 seconds to prevent double-tapping
    setNavigationDisabled(true);
    setTimeout(() => {
      setNavigationDisabled(false);
      console.log('✅ Navigation re-enabled');
    }, 1500);

    // Reset user pause state
    setIsUserPaused(false);

    // Navigate based on tap position
    if (tapX < screenCenter) {
      // Left tap - previous story
      if (hasPrevious) {
        console.log('⬅️ Going to previous story');
        onPrevious();
      } else {
        console.log('⬅️ No previous story available');
      }
    } else {
      // Right tap - next story
      if (hasNext) {
        console.log('➡️ Going to next story');
        onNext();
      } else {
        console.log('➡️ No next story, closing modal');
        onClose();
      }
    }
  };

  if (!story) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
      <SafeAreaView style={styles.container}>
        <View style={styles.storyContainer} {...panResponder.panHandlers}>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(story.consumer?.name || 'A')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {story.userName || story.consumer?.name || 'Anonim'}
                </Text>
                <Text style={styles.timestamp}>
                  {new Date(story.createdAt).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Story Image - Instagram-like tap behavior */}
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={handleTapPress}
            activeOpacity={1}
          >
            <Image
              source={{ uri: story.photoUrl || story.photos?.[0]?.url }}
              style={styles.storyImage}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>Puanlama:</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Text
                    key={star}
                    style={[
                      styles.star,
                      star <= story.rating ? styles.starFilled : styles.starEmpty
                    ]}
                  >
                    ⭐
                  </Text>
                ))}
              </View>
              <Text style={styles.ratingNumber}>({story.rating}/5)</Text>
            </View>

            <View style={styles.packageInfo}>
              <Text style={styles.restaurantName}>
                📍 {story.restaurantName || story.restaurant?.name || 'Restaurant'}
              </Text>
              <Text style={styles.packageName}>
                🎁 {story.packageName || story.packageInfo?.packageName || 'Sürpriz Paket'}
              </Text>
              {story.packageInfo?.packagePrice && (
                <Text style={styles.packagePrice}>
                  💰 {story.packageInfo.packagePrice} TL
                </Text>
              )}
            </View>

            {/* Navigation Hints */}
            <View style={styles.navigationHints}>
              <Text style={styles.hintText}>
                ← Önceki    Aşağı kaydır: Kapat    Sonraki →
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  storyContainer: {
    flex: 1,
    position: 'relative',
  },
  progressContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight + 10,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 1.5,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 26,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width: width,
    height: height * 0.7,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingLabel: {
    color: '#ffffff',
    fontSize: 14,
    marginRight: 8,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  star: {
    fontSize: 16,
  },
  starFilled: {
    color: '#f59e0b',
  },
  starEmpty: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  ratingNumber: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  packageInfo: {
    marginBottom: 12,
  },
  restaurantName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  packageName: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginBottom: 2,
  },
  packagePrice: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  navigationHints: {
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default StoryModal;