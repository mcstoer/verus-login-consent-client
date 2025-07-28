import React from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import { VdxfUniType } from 'verus-typescript-primitives';
import { VDXF_ID_TO_READABLE } from '../../../utils/constants';

interface VdxfKeyRendererProps {
  vdxfKey: string;
  vdxfValue: VdxfUniType;
  index: number;
  vdxfIndex: number;
}

const VdxfKeyRenderer: React.FC<VdxfKeyRendererProps> = ({ vdxfKey, vdxfValue, index, vdxfIndex }) => {
  const getReadableName = (vdxfId: string): string => {
    return VDXF_ID_TO_READABLE[vdxfId] || vdxfId;
  };

  const getJsonDisplay = (value: VdxfUniType): string => {
    try {
      if (Buffer.isBuffer(value)) {
        return JSON.stringify(value.toString('hex'), null, 2);
      } else if (typeof value === 'string') {
        return JSON.stringify(value, null, 2);
      } else if (value && typeof value === 'object' && 'toJson' in value && typeof value.toJson === 'function') {
        return JSON.stringify(value.toJson(), null, 2);
      } else {
        return JSON.stringify(value, null, 2);
      }
    } catch (error) {
      return `Error serializing to JSON: ${error}`;
    }
  };

  return (
    <Box key={`${index}-${vdxfIndex}`}>
      <ListItem dense sx={{ pl: 6 }}>
        <ListItemText
          primary={getReadableName(vdxfKey)}
          secondary={vdxfKey}
          slotProps={{
            primary: { variant: 'body2' },
            secondary: {
              color: 'text.secondary',
              variant: 'caption',
              sx: { wordBreak: 'break-all', fontSize: '0.65rem' }
            }
          }}
        />
      </ListItem>
      <ListItem dense sx={{ pl: 8 }}>
        <ListItemText
          primary="JSON Value:"
          secondary={getJsonDisplay(vdxfValue)}
          slotProps={{
            primary: {
              variant: 'caption',
              color: 'text.secondary',
              sx: { fontSize: '0.6rem', fontWeight: 'bold' }
            },
            secondary: {
              variant: 'body2',
              color: 'text.primary',
              sx: {
                wordBreak: 'break-all',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                padding: '8px',
                borderRadius: '4px',
                marginTop: '4px'
              }
            }
          }}
        />
      </ListItem>
    </Box>
  );
};

export default VdxfKeyRenderer;
