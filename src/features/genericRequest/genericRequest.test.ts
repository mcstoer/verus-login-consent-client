import {GenericRequest, VERUSPAY_INVOICE_DETAILS_VDXF_ORDINAL} from 'verus-typescript-primitives';
import {Identity} from '#/redux/reducers/signatureInfo/signatureInfo.types';
import {loadIdentities} from '#/rpc/calls/identities';
import {verifyGenericRequest} from '#/rpc/calls/verifyGenericRequest';
import {checkGenericRequest} from './genericRequest';

// Mock the external API calls
jest.mock('#/rpc/calls/verifyGenericRequest');
jest.mock('#/rpc/calls/identities');

const mockedVerifyGenericRequest = verifyGenericRequest as jest.MockedFunction<
  typeof verifyGenericRequest
>;
const mockedLoadIdentities = loadIdentities as jest.MockedFunction<typeof loadIdentities>;

describe('genericRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkGenericRequest', () => {
    const chainId = 'VRSCTEST';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        isValidVersion: true,
        version: 1,
        details: [{type: 'some-detail-type'}],
        isSigned: jest.fn().mockReturnValue(false),
        hasMultiDetails: jest.fn().mockReturnValue(false),
        hasAppOrDelegatedID: jest.fn().mockReturnValue(false),
      };
    });

    it('should throw error for invalid version', async () => {
      mockRequest.isValidVersion = false;
      mockRequest.version = 999;

      await expect(checkGenericRequest(chainId, mockRequest as GenericRequest)).rejects.toThrow(
        'The request version 999 is unsupported.'
      );
    });

    it('should throw error for request with no details', async () => {
      mockRequest.details = [];

      await expect(checkGenericRequest(chainId, mockRequest as GenericRequest)).rejects.toThrow(
        'The request contains no details.'
      );
    });

    it('should throw error for unsigned multi-detail request', async () => {
      (mockRequest.isSigned as jest.Mock).mockReturnValue(false);
      (mockRequest.hasMultiDetails as jest.Mock).mockReturnValue(true);

      await expect(checkGenericRequest(chainId, mockRequest as GenericRequest)).rejects.toThrow(
        'The request is not signed.'
      );
    });

    it('should throw error for unsigned request that is not a VerusPay invoice', async () => {
      (mockRequest.isSigned as jest.Mock).mockReturnValue(false);
      (mockRequest.hasMultiDetails as jest.Mock).mockReturnValue(false);
      mockRequest.details = [{type: 'not-veruspay-invoice'}];

      await expect(checkGenericRequest(chainId, mockRequest as GenericRequest)).rejects.toThrow(
        'The request is not signed.'
      );
    });

    it('should allow unsigned VerusPay invoice', async () => {
      (mockRequest.isSigned as jest.Mock).mockReturnValue(false);
      (mockRequest.hasMultiDetails as jest.Mock).mockReturnValue(false);
      mockRequest.details = [{type: VERUSPAY_INVOICE_DETAILS_VDXF_ORDINAL}];

      await expect(
        checkGenericRequest(chainId, mockRequest as GenericRequest)
      ).resolves.not.toThrow();
    });

    it('should verify signature for signed request', async () => {
      (mockRequest.isSigned as jest.Mock).mockReturnValue(true);
      mockedVerifyGenericRequest.mockResolvedValue({
        verified: true,
        message: 'Signature is valid',
      });

      await checkGenericRequest(chainId, mockRequest as GenericRequest);

      expect(mockedVerifyGenericRequest).toHaveBeenCalledWith(chainId, mockRequest);
    });

    it('should throw error if signature verification fails', async () => {
      (mockRequest.isSigned as jest.Mock).mockReturnValue(true);
      mockedVerifyGenericRequest.mockResolvedValue({
        verified: false,
        message: 'Invalid signature',
      });

      await expect(checkGenericRequest(chainId, mockRequest as GenericRequest)).rejects.toThrow(
        'Invalid signature'
      );
    });

    it('should verify signing identity exists for request with appOrDelegatedID', async () => {
      const signingIdentityAddress = 'iTestIdentity123@';
      (mockRequest.isSigned as jest.Mock).mockReturnValue(true);
      (mockRequest.hasAppOrDelegatedID as jest.Mock).mockReturnValue(true);
      mockRequest.signature = {
        identityID: {
          toIAddress: jest.fn().mockReturnValue(signingIdentityAddress),
        },
      };

      mockedVerifyGenericRequest.mockResolvedValue({
        verified: true,
      });

      const mockIdentity: Identity = {
        identity: {
          identityaddress: signingIdentityAddress,
        },
      } as Identity;

      mockedLoadIdentities.mockResolvedValue([mockIdentity] as Identity[]);

      await checkGenericRequest(chainId, mockRequest as GenericRequest);

      expect(mockedLoadIdentities).toHaveBeenCalledWith(chainId);
      expect(mockRequest.signature.identityID.toIAddress).toHaveBeenCalled();
    });

    it('should throw error if signing identity not in wallet for appOrDelegatedID', async () => {
      const signingIdentityAddress = 'iTestIdentity123@';
      const differentIdentityAddress = 'iDifferentIdentity456@';

      (mockRequest.isSigned as jest.Mock).mockReturnValue(true);
      (mockRequest.hasAppOrDelegatedID as jest.Mock).mockReturnValue(true);
      mockRequest.signature = {
        identityID: {
          toIAddress: jest.fn().mockReturnValue(signingIdentityAddress),
        },
      };

      mockedVerifyGenericRequest.mockResolvedValue({
        verified: true,
      });

      const mockIdentity: Identity = {
        identity: {
          identityaddress: differentIdentityAddress,
        },
      } as Identity;

      mockedLoadIdentities.mockResolvedValue([mockIdentity] as Identity[]);

      await expect(checkGenericRequest(chainId, mockRequest as GenericRequest)).rejects.toThrow(
        'The signing identity is not in the wallet, so having an app or delegated ID is not allowed.'
      );
    });

    it('should pass for signed request without appOrDelegatedID', async () => {
      (mockRequest.isSigned as jest.Mock).mockReturnValue(true);
      (mockRequest.hasAppOrDelegatedID as jest.Mock).mockReturnValue(false);

      mockedVerifyGenericRequest.mockResolvedValue({
        verified: true,
      });

      await checkGenericRequest(chainId, mockRequest as GenericRequest);

      expect(mockedVerifyGenericRequest).toHaveBeenCalledWith(chainId, mockRequest);
      expect(mockedLoadIdentities).not.toHaveBeenCalled();
    });
  });
});
