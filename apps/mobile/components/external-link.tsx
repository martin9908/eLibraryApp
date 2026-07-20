import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ReactNode } from 'react';
import { Linking, Platform, Pressable, type PressableProps } from 'react-native';

type Props = PressableProps & { href: string; children: ReactNode };

export function ExternalLink({ href, onPress, children, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      onPress={async (event) => {
        onPress?.(event);

        if (Platform.OS === 'web') {
          await Linking.openURL(href);
          return;
        }

        await openBrowserAsync(href, {
          presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
        });
      }}>
      {children}
    </Pressable>
  );
}
