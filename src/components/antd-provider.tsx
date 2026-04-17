

import { ConfigProvider, theme } from "antd";

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#0ea5e9",
          colorBgContainer: "rgba(10, 15, 25, 0.4)",
          colorBgElevated: "rgba(10, 15, 25, 0.95)",
          colorBorder: "rgba(255, 255, 255, 0.1)",
          borderRadius: 16,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          colorText: "#ffffff",
          colorTextSecondary: "rgba(255, 255, 255, 0.4)",
        },
        components: {
          Modal: {
            contentBg: "rgba(10, 15, 25, 0.98)",
            headerBg: "transparent",
            titleColor: "#ffffff",
          },
          Input: {
            colorBgContainer: "rgba(255, 255, 255, 0.03)",
            colorBorder: "rgba(255, 255, 255, 0.08)",
            activeBorderColor: "#0ea5e9",
            hoverBorderColor: "rgba(14, 165, 233, 0.3)",
          },
          Select: {
            colorBgContainer: "rgba(255, 255, 255, 0.03)",
            colorBgElevated: "rgba(10, 15, 25, 0.98)",
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
