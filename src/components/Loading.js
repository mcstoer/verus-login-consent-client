/**
 * This container shows a loading animation while the plugin is waiting on
 * an initialization ipc call
 */

import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

class Loading extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{display: 'flex'}}>
          <CircularProgress disableShrink />
        </Box>
      </div>
    );
  }
}

export default Loading;
