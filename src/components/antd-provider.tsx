

import { ConfigProvider } from "antd";

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "var(--primary)",
          borderRadius: 8,
          fontFamily: "inherit",
        },
        components: {
          Input: {
            colorBgContainer: "var(--input)",
            colorBorder: "transparent",
            activeBorderColor: "var(--ring)",
            hoverBorderColor: "transparent",
            activeShadow: "none",
          },
          Dropdown: {
            controlItemBgHover: "var(--accent)",
            borderRadiusLG: 10,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
