import React from 'react';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { unixToDate } from '../../utils/math';
import IdentityInformation from './IdentityInformation';

export function RequestCard(props) {
  const chainName = props.chainName;
  const systemId = props.systemId;
  const revocationIdentity = props.revocationIdentity;
  const recoveryIdentity = props.recoveryIdentity;
  const signedBy = props.signedBy;
  const signerFqn = props.signerFqn;
  const time = props.time;
  const permissions = props.permissions;
  const height = props.height;

  const systemIdentityDescriptor = `${chainName} (${systemId})`;

  return (
    <Card square sx={{
      marginTop:1,
      marginBottom:1,
      width: '100%',
      overflowY: 'scroll',
      maxHeight: height,
    }}> 
      <List>
        <IdentityInformation
          label="Requested by"
          signedBy={signedBy}
          signerFqn={signerFqn}
          chainName={chainName}
          systemId={systemId}
          revocationIdentity={revocationIdentity}
          recoveryIdentity={recoveryIdentity}
        />

        <ListItem divider>
          <ListItemText primary="Permissions requested" disableTypography sx={{ fontWeight: 'bold', pr:4}}/>
          <ListItemText primary={permissions} disableTypography sx={{textAlign:'right'}}/>
        </ListItem>

        <ListItem divider>
          <ListItemText primary="System name" disableTypography sx={{ fontWeight: 'bold', pr:4}}/>
          <ListItemText primary={systemIdentityDescriptor} disableTypography sx={{textAlign:'right'}}/>
        </ListItem>

        <ListItem>
          <ListItemText primary="Signed on" disableTypography sx={{ fontWeight: 'bold', pr:4}}/>
          <ListItemText primary={unixToDate(time)} disableTypography sx={{textAlign:'right'}}/>
        </ListItem>
      </List>
    </Card> 
  );
}