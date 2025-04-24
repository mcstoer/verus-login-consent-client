import React from 'react';
import PropTypes from 'prop-types';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

// IdentityInformationItem is a list item for displaying the details of an identity.
function IdentityInformationItem({field, value}) {
  return (
    <ListItem divider sx={{pl:4, pr:4}}>
      <ListItemText primary={field} disableTypography/>
      <ListItemText
        primary={value}
        disableTypography
        sx={{textAlign:'right', color: "#878787"}}
      />
    </ListItem>
  );
}

IdentityInformationItem.propTypes = {
  field: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired
};

const IdentityInformation = ({
  label,
  signedBy, 
  signerFqn,
  chainName,
  systemId,
  revocationIdentity,
  recoveryIdentity
}) => {

  const [openIdentity, setOpenIdentity] = React.useState(false);

  const identityDescriptor = `${signerFqn} (${signedBy.identity.identityaddress})`;
  const systemIdentityDescriptor = `${chainName} (${systemId})`;
  const revocationIdentityDescriptor = `${revocationIdentity.friendlyname} (${revocationIdentity.identity.identityaddress})`;
  const recoveryIdentityDescriptor = `${recoveryIdentity.friendlyname} (${recoveryIdentity.identity.identityaddress})`;

  const handleIdentityClick = () => {
    setOpenIdentity(!openIdentity);
  };

  return (
    <>
      <ListItemButton divider onClick={handleIdentityClick}>
        <ListItemText primary={label} disableTypography sx={{ fontWeight: 'bold', pr:4}}/>
        <ListItemText primary={identityDescriptor} disableTypography sx={{textAlign:'right'}}/>
        {openIdentity ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={openIdentity} timeout="auto" unmountOnExit>
        <List component="div" dense disablePadding>
          <IdentityInformationItem
            field={"Name"}
            value={signedBy.identity.name}
          />
          <IdentityInformationItem
            field={"Identity Address"}
            value={signedBy.identity.identityaddress}
          />
          <IdentityInformationItem
            field={"Status"}
            value={signedBy.status}
          />
          <IdentityInformationItem
            field={"Revocation Authority"}
            value={revocationIdentityDescriptor}
          />
          <IdentityInformationItem
            field={"Recovery Authority"}
            value={recoveryIdentityDescriptor}
          />
          <IdentityInformationItem
            field={"System"}
            value={systemIdentityDescriptor}
          />
          <IdentityInformationItem
            field={"Primary Address #1"}
            value={signedBy.identity.primaryaddresses[0]}
          />
        </List>
      </Collapse>
    </>
  );
};

IdentityInformation.propTypes = {
  label: PropTypes.string.isRequired,
  signedBy: PropTypes.object.isRequired,
  signerFqn: PropTypes.string.isRequired,
  chainName: PropTypes.string.isRequired,
  systemId: PropTypes.string.isRequired,
  revocationIdentity: PropTypes.object.isRequired,
  recoveryIdentity: PropTypes.object.isRequired
};

export default IdentityInformation;