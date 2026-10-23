export type AppColors = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryMuted: string;
  onPrimary: string;
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  danger: string;
  dangerMuted: string;
  overlay: string;
  shadow: string;
};

export function getColors(isDark: boolean): AppColors {
  return isDark
    ? {
        bg: '#071018',
        surface: '#12202B',
        surfaceAlt: '#183041',
        text: '#F4F7F8',
        textMuted: '#8BA0AD',
        border: '#243746',
        primary: '#2DD4BF',
        primaryMuted: '#134E4A',
        onPrimary: '#042F2E',
        success: '#34D399',
        successMuted: '#064E3B',
        warning: '#FBBF24',
        warningMuted: '#78350F',
        danger: '#FB7185',
        dangerMuted: '#4C0519',
        overlay: 'rgba(2, 8, 12, 0.72)',
        shadow: '#000000',
      }
    : {
        bg: '#F3F6F5',
        surface: '#FFFFFF',
        surfaceAlt: '#F7FAF9',
        text: '#102027',
        textMuted: '#5B6B73',
        border: '#D7E2DE',
        primary: '#0F766E',
        primaryMuted: '#CCFBF1',
        onPrimary: '#FFFFFF',
        success: '#047857',
        successMuted: '#D1FAE5',
        warning: '#B45309',
        warningMuted: '#FEF3C7',
        danger: '#BE123C',
        dangerMuted: '#FFE4E6',
        overlay: 'rgba(16, 32, 39, 0.48)',
        shadow: '#102027',
      };
}
