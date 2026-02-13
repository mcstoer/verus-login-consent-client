import {VerusIdLogo} from '#/images';
import {
  AppBar,
  Box,
  CircularProgress,
  Container,
  Divider,
  SxProps,
  Theme,
  Toolbar,
  Typography,
} from '@mui/material';
import React from 'react';

interface PageLayoutProps {
  children?: React.ReactNode;
  title?: string;
  showLogo?: boolean;
  logoWidth?: string;
  logoHeight?: string;
  footerContent?: React.ReactNode;
  contentStyle?: SxProps<Theme>;
  containerStyle?: SxProps<Theme>;
  loading?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  showLogo = true,
  footerContent,
  contentStyle = {},
  containerStyle = {},
  loading = false,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        height: '100%',
        ...containerStyle,
      }}
    >
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          {showLogo && (
            <Box
              component="img"
              src={VerusIdLogo}
              alt="Verus ID Logo"
              sx={{
                height: 40,
                width: 'auto',
                marginRight: 2,
                objectFit: 'contain',
              }}
            />
          )}

          {title && (
            <Typography variant="subtitle1" color="text.secondary" component="div">
              {title}
            </Typography>
          )}
        </Toolbar>
      </AppBar>
      <Divider />

      <Container
        maxWidth={false}
        sx={{
          height: '100%',
          display: 'flex',
          padding: 4,
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1,
          backgroundColor: 'grey.100',
        }}
      >
        {/* Main content area */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            height: '64vh',
            ...contentStyle,
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            children
          )}
        </Box>

        {/* Footer area */}
        {footerContent && (
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              marginTop: 'auto',
              paddingTop: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
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
