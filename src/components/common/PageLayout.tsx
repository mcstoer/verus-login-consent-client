import React from 'react';
import { Box, Container, SxProps, Theme } from '@mui/material';
import { VerusIdLogo } from "../../images";

interface PageLayoutProps {
  children?: React.ReactNode;
  title?: string;
  showLogo?: boolean;
  logoWidth?: string;
  logoHeight?: string;
  footerContent?: React.ReactNode;
  contentStyle?: SxProps<Theme>;
  containerStyle?: SxProps<Theme>;
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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "100%",
        ...containerStyle
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          height: "100%",
          display: "flex",
          padding: 4,
          flexDirection: "column",
          alignItems: "center",
          flex: 1
        }}
      >
        {showLogo && (
          <Box
            component="img"
            src={VerusIdLogo}
            alt="Verus ID Logo"
            sx={{
              width: logoWidth,
              height: logoHeight,
              objectFit: 'contain'
            }}
          />
        )}
        
        {title && (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-start",
            }}
          >
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
                padding: 1,
              }}
            >
              {title}
            </Box>
          </Box>
        )}

        {/* Main content area */}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            ...contentStyle
          }}
        >
          {children}
        </Box>

        {/* Footer area */}
        {footerContent && (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "flex-end",
              marginTop: "auto",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              {footerContent}
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default PageLayout;
