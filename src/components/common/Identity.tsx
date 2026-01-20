import React, {useState} from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import {createIdentityDescriptor} from '#/utils/identity';
import {Identity} from '#/redux/reducers/signatureInfo/signatureInfo.types';

interface IdentityField {
  label: string;
  value: string;
  visible?: boolean;
}

interface IdentityDetailsProps {
  identity: Identity | null | undefined;
  revocationAuthority?: Identity | null | undefined;
  recoveryAuthority?: Identity | null | undefined;
  systemDescriptor?: string;
  headerLabel?: string;
  initiallyExpanded?: boolean;
  divider?: boolean;
}

const IdentityDetailItem: React.FC<{field: string; value: string}> = ({field, value}) => (
  <ListItem divider sx={{pl: 6, pr: 2, py: 0.5, minHeight: 48}}>
    <ListItemText
      primary={value}
      secondary={field}
      slotProps={{
        primary: {variant: 'body2', sx: {lineHeight: 1.3}},
        secondary: {color: 'text.secondary', variant: 'caption', sx: {lineHeight: 1.2}}
      }}
    />
  </ListItem>
);

const IdentityDetails: React.FC<IdentityDetailsProps> = ({
  identity,
  revocationAuthority,
  recoveryAuthority,
  systemDescriptor,
  headerLabel = 'Requested by',
  initiallyExpanded = false,
  divider = true
}) => {
  const [expanded, setExpanded] = useState<boolean>(initiallyExpanded);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const identityName = identity?.identity?.name as string || '-';
  const identityAddress = identity?.identity?.identityaddress || '-';
  const headerPrimary = identity?.identity?.identityaddress
    ? `${identityName} (${identityAddress})`
    : identityName;

  const fields: IdentityField[] = [
    {
      label: 'Name',
      value: identityName,
      visible: true
    },
    {
      label: 'Identity Address',
      value: identityAddress,
      visible: true
    },
    {
      label: 'Status',
      value: (identity?.status as string) || '-',
      visible: true
    },
    {
      label: 'Revocation Authority',
      value: createIdentityDescriptor(revocationAuthority),
      visible: !!revocationAuthority
    },
    {
      label: 'Recovery Authority',
      value: createIdentityDescriptor(recoveryAuthority),
      visible: !!recoveryAuthority
    },
    {
      label: 'System',
      value: systemDescriptor || '-',
      visible: !!systemDescriptor
    },
    {
      label: 'Primary Address #1',
      value: (identity?.identity?.primaryaddresses?.[0] as string) || '-',
      visible: !!identity?.identity?.primaryaddresses?.[0]
    }
  ];

  return (
    <>
      <ListItemButton
        divider={divider}
        onClick={handleToggle}
      >
        <ListItemText
          primary={headerPrimary}
          secondary={headerLabel}
          slotProps={{
            primary: {variant: 'subtitle1'},
            secondary: {color: 'text.secondary', variant: 'body2'}
          }}
        />
        {expanded ? <ExpandLess color="action" /> : <ExpandMore color="action" />}
      </ListItemButton>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List
          component="div"
          dense
          disablePadding
        >
          {fields.filter(field => field.visible !== false).map((field) => (
            <IdentityDetailItem
              key={field.label}
              field={field.label}
              value={field.value}
            />
          ))}
        </List>
      </Collapse>
    </>
  );
};

export default IdentityDetails;
