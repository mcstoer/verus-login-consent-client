import React, {useState} from 'react';
import {useSelector} from 'react-redux';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

import {GenericRequest, DataPacketRequestOrdinalVDXFObject} from 'verus-typescript-primitives';

import PageLayout from '#/components/PageLayout';
import {isLastDetail} from '#/features/details/detailNavigation';
import {useAppDispatch} from '#/redux/hooks';
import {
  navigateBackGenericRequest,
  navigateGenericRequest,
} from '#/redux/reducers/navigation/navigationSlice';
import {RootState} from '#/redux/store';

const LIST_ITEM_SLOTS = {
  standard: {
    primary: {variant: 'subtitle1' as const},
    secondary: {color: 'text.secondary' as const, variant: 'body2' as const},
  },
  nested: {
    primary: {variant: 'body2' as const, sx: {lineHeight: 1.3}},
  },
  collapsible: {
    primary: {variant: 'subtitle1' as const},
    secondary: {color: 'text.secondary' as const, variant: 'body2' as const},
  },
} as const;

const DataPacket: React.FC = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [openObjects, setOpenObjects] = useState<{[key: number]: boolean}>({});

  const deeplinkData = useSelector((state: RootState) => state.deeplink.data);
  const currentDetailIndex = useSelector((state: RootState) => state.navigation.currentDetailIndex);

  if (!(deeplinkData instanceof GenericRequest)) {
    throw new Error('Unable to handle data packets outside of generic requests.');
  }

  const ordinal = deeplinkData.details[currentDetailIndex];

  if (!(ordinal instanceof DataPacketRequestOrdinalVDXFObject)) {
    throw new Error('Unable to handle non-data packet ordinal.');
  }

  const dataPacketDetails = ordinal.data;

  const getDisplayData = (objectdata: Buffer, mimeType?: string): string => {
    if (mimeType && mimeType.startsWith('text/')) {
      return objectdata.toString('utf-8');
    }
    return objectdata.toString('hex');
  };

  const isLastDetailInRequest = isLastDetail(deeplinkData, currentDetailIndex);
  const continueButtonText = isLastDetailInRequest ? 'Finish' : 'Continue';
  const continueButtonColor = isLastDetailInRequest ? 'primary' : 'success';

  const handleObjectClick = (index: number) => {
    setOpenObjects(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleNext = async (): Promise<void> => {
    setLoading(true);
    try {
      dispatch(navigateGenericRequest());
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (): Promise<void> => {
    setLoading(true);
    try {
      dispatch(navigateBackGenericRequest());
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Review the data to be signed"
      loading={loading}
      contentStyle={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
      footerContent={
        <div style={{display: 'flex', justifyContent: 'flex-end', width: '100%'}}>
          <Button
            variant="text"
            disabled={loading}
            color="secondary"
            onClick={() => cancel()}
            style={{
              width: 120,
              marginRight: 32,
              padding: 8,
            }}
          >
            {'Back'}
          </Button>
          <Button
            variant="contained"
            disabled={loading}
            color={continueButtonColor}
            onClick={() => handleNext()}
            style={{
              width: 120,
              padding: 8,
            }}
          >
            {continueButtonText}
          </Button>
        </div>
      }
    >
      <Card
        square
        sx={{
          width: '100%',
          maxHeight: '100%',
          minHeight: 0,
          overflowY: 'auto',
          scrollbarGutter: 'stable',
        }}
      >
        <List disablePadding sx={{'& > *:last-child': {borderBottom: 'none'}}}>
          {dataPacketDetails.hasStatements() &&
            dataPacketDetails.statements &&
            dataPacketDetails.statements.length > 0 && (
              <>
                <ListItem divider>
                  <ListItemText
                    primary="Statements"
                    slotProps={{
                      primary: {variant: 'subtitle1' as const},
                    }}
                  />
                </ListItem>

                <List component="div" dense disablePadding>
                  {dataPacketDetails.statements.map((statement, index) => (
                    <ListItem key={index} divider sx={{pl: 6, pr: 2, py: 0.5, minHeight: 48}}>
                      <ListItemText primary={statement} slotProps={LIST_ITEM_SLOTS.nested} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

          {dataPacketDetails.signableObjects &&
            dataPacketDetails.signableObjects.length > 0 &&
            dataPacketDetails.signableObjects.map((dataDescriptor, index) => (
              <React.Fragment key={index}>
                <ListItemButton divider onClick={() => handleObjectClick(index)}>
                  <ListItemText
                    primary={
                      `Object #${index + 1}` +
                      (dataDescriptor.label ? `: ${dataDescriptor.label}` : '')
                    }
                    slotProps={LIST_ITEM_SLOTS.collapsible}
                  />
                  {openObjects[index] ? (
                    <ExpandLess color="action" />
                  ) : (
                    <ExpandMore color="action" />
                  )}
                </ListItemButton>

                <Collapse in={openObjects[index]} timeout="auto" unmountOnExit>
                  <List
                    component="div"
                    dense
                    disablePadding
                    sx={{'& > *:last-child': {borderBottom: 'none'}}}
                  >
                    {dataDescriptor.label && (
                      <ListItem divider sx={{pl: 6, pr: 2, py: 0.5, minHeight: 48}}>
                        <ListItemText
                          primary={dataDescriptor.label}
                          secondary="Label"
                          slotProps={LIST_ITEM_SLOTS.standard}
                        />
                      </ListItem>
                    )}
                    {dataDescriptor.mimeType && (
                      <ListItem divider sx={{pl: 6, pr: 2, py: 0.5, minHeight: 48}}>
                        <ListItemText
                          primary={dataDescriptor.mimeType}
                          secondary="MIME Type"
                          slotProps={LIST_ITEM_SLOTS.standard}
                        />
                      </ListItem>
                    )}
                    {dataDescriptor.objectdata && (
                      <ListItem divider sx={{pl: 6, pr: 2, py: 0.5, minHeight: 48}}>
                        <ListItemText
                          primary={getDisplayData(
                            dataDescriptor.objectdata,
                            dataDescriptor.mimeType
                          )}
                          secondary="Data"
                          slotProps={LIST_ITEM_SLOTS.standard}
                        />
                      </ListItem>
                    )}
                  </List>
                </Collapse>
              </React.Fragment>
            ))}
        </List>
      </Card>
    </PageLayout>
  );
};

export default DataPacket;
