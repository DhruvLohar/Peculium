import React, { memo, useCallback, useRef, useState } from "react";
import { View, FlatList, Dimensions, Pressable, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import { useRouter } from "expo-router";
import CustomText from "@/components/atoms/CustomText";
import Button from "@/components/atoms/Button";

const { width } = Dimensions.get("window");

interface Slide {
  id: string;
  title: string;
  subtitle: string;
}

const slides: Slide[] = [
  {
    id: "1",
    title: "Main Character Energy.",
    subtitle: "Your money shouldn't be a mystery. Ditch the boring spreadsheets and take absolute control of your daily cash.",
  },
  {
    id: "2",
    title: "Make Every Cent Sweat.",
    subtitle: "Log expenses in seconds. Turn your chaotic spending habits into beautiful, brutalist charts that actually make sense.",
  },
  {
    id: "3",
    title: "Lock Down The \n Vault.",
    subtitle: "Set ruthless budgets, build daily saving streaks, and secure the bag. It is time to build your private fund.",
  },
];

const OnboardingScreen: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      // Navigate to login
      router.push("/login");
    }
  }, [currentIndex, router]);

  const handleSkip = useCallback(() => {
    router.replace("/(tabs)");
  }, [router]);

  const renderSlide = useCallback(({ item }: { item: Slide }) => {
    return (
      <View style={{ width }} className="flex-1 px-8 pb-20">
        {/* Image placeholder */}
        <View className="flex-1 items-center justify-center mb-8">
          <View className="w-full h-96 bg-accent border-4 border-black items-center justify-center shadow-md">
            <CustomText variant="muted" className="text-center">
              Image Placeholder
            </CustomText>
          </View>
        </View>

        {/* Content */}
        <View className="px-4">
          <CustomText variant="h1" className="mb-4 text-center">
            {item.title}
          </CustomText>
          <CustomText variant="p" className="text-center text-muted-foreground leading-6">
            {item.subtitle}
          </CustomText>
        </View>
      </View>
    );
  }, []);

  const renderDots = useCallback(() => {
    return (
      <View className="flex-row justify-center items-center mb-8">
        {slides.map((_, index) => (
          <View
            key={index}
            className={`h-2 mx-1 ${
              index === currentIndex ? "w-8 bg-foreground" : "w-2 bg-muted"
            }`}
          />
        ))}
      </View>
    );
  }, [currentIndex]);

  const getButtonText = useCallback(() => {
    if (currentIndex === slides.length - 1) {
      return "Let's Go";
    }
    return "Next";
  }, [currentIndex]);

  return (
    <View className="flex-1 bg-background">
      {/* Skip Button */}
      <View className="absolute top-16 right-6 z-10">
        <Pressable onPress={handleSkip} className="px-4 py-2">
          <CustomText variant="label" className="font-semibold">
            Skip
          </CustomText>
        </Pressable>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      />

      {/* Bottom Section */}
      <View className="pb-12 px-8">
        {renderDots()}
        
        <Button
          onPress={handleNext}
          variant="default"
          size="lg"
          className="w-full"
        >
          {getButtonText()}
        </Button>
      </View>
    </View>
  );
};

export default memo(OnboardingScreen);
