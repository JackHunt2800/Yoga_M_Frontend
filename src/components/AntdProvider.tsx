'use client';

import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, theme } from 'antd';

export const AntdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#121314',
            colorInfo: '#A8751E',
            colorSuccess: '#8B9E82',
            colorWarning: '#D9A74A',
            colorError: '#BA1A1A',
            colorTextBase: '#111213',
            colorBgBase: '#FAF8F0',
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            borderRadius: 8,
            borderRadiusLG: 12,
            borderRadiusSM: 4,
          },
          components: {
            Button: {
              controlHeight: 40,
              borderRadius: 8,
              fontWeight: 600,
            },
            Card: {
              borderRadiusLG: 16,
            },
            Modal: {
              borderRadiusLG: 20,
            },
            Tabs: {
              inkBarColor: '#121314',
              itemActiveColor: '#121314',
              itemSelectedColor: '#121314',
              itemHoverColor: '#A8751E',
            },
            Input: {
              controlHeight: 42,
              borderRadius: 8,
              activeBorderColor: '#121314',
              hoverBorderColor: '#A8751E',
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
};
