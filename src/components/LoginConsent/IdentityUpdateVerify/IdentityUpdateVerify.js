import React, { useState } from 'react';
import Button from '@mui/material/Button';
import { VerusIdLogo } from "../../../images";

const IdentityUpdateVerify = (props) => {
  // eslint-disable-next-line react/prop-types
  const { completeLoginConsent } = props;
  const [loading, setLoading] = useState(false);

  const cancel = async () => {
    setLoading(true);
    await completeLoginConsent();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "100%",
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
        <img src={VerusIdLogo} width={'55%'} height={'10%'}/>
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
            {"Verify Identity Update Request"}
          </div>
        </div>
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
            <Button
              variant="text"
              disabled={loading}
              color="secondary"
              onClick={() => cancel()}
              style={{
                width: 120,
                padding: 8,
              }}
            >
              {"Cancel"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityUpdateVerify;
