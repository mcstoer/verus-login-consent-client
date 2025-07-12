import React from 'react';
import { VerusIdLogo } from "../../images";

interface PageLayoutProps {
  children?: React.ReactNode;
  title?: string;
  showLogo?: boolean;
  logoWidth?: string;
  logoHeight?: string;
  footerContent?: React.ReactNode;
  contentStyle?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  title, 
  showLogo = true, 
  logoWidth = '55%', 
  logoHeight = '10%',
  footerContent,
  contentStyle = {},
  containerStyle = {}
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "100%",
        ...containerStyle
      }}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          padding: 32,
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {showLogo && (
          <img 
            src={VerusIdLogo} 
            width={logoWidth} 
            height={logoHeight}
            alt="Verus ID Logo"
          />
        )}
        
        {title && (
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
            }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
                padding: 8,
              }}
            >
              {title}
            </div>
          </div>
        )}

        {/* Main content area */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            ...contentStyle
          }}
        >
          {children}
        </div>

        {/* Footer area */}
        {footerContent && (
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "flex-end",
              marginTop: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              {footerContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageLayout;
