import {extractConsentDataV1, extractConsentDataV2} from './consentDataExtractors';
import {GenericRequest, LoginConsentRequest, AuthenticationRequestOrdinalVDXFObject} from 'verus-typescript-primitives';
import {Identity} from '../../redux/reducers/signatureInfo/signatureInfo.types';

describe('consentDataExtractors', () => {
  describe('extractConsentDataV1', () => {
    it('should extract consent data from LoginConsentRequest', () => {
      const mockRequest = {
        system_id: 'iJhCezBExJHvtyH3fSUwhzybVMVcCL9Gjf',
        challenge: {
          requested_access: [
            {vdxfkey: 'iCVH2MqhgvFiGu3NqcRK9FgDjfRtpQQkCy'},
          ],
          redirect_uris: [
            {uri: 'https://example.com/callback'},
          ],
        },
      } as unknown as LoginConsentRequest;

      const mockSignedBy = {
        fullyqualifiedname: 'testuser@',
      } as unknown as Identity;

      const result = extractConsentDataV1(mockRequest, mockSignedBy);

      expect(result).toHaveProperty('signerFqn');
      expect(result).toHaveProperty('permissionsLabels');
      expect(result).toHaveProperty('systemId');
      expect(result).toHaveProperty('responseURIsLabels');
      expect(result.systemId).toBe('iJhCezBExJHvtyH3fSUwhzybVMVcCL9Gjf');
      expect(Array.isArray(result.permissionsLabels)).toBe(true);
      expect(Array.isArray(result.responseURIsLabels)).toBe(true);
      expect(result.responseURIsLabels).toEqual(['https://example.com/callback']);
    });
  });

  describe('extractConsentDataV2', () => {
    it('should extract consent data from GenericRequest', () => {
      const mockAuthRequestDetail = {
        hasExpiryTime: () => false,
        recipientConstraints: [],
        responseURIs: [],
      };

      const mockOrdinalWrapper = new AuthenticationRequestOrdinalVDXFObject();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockOrdinalWrapper as any).data = mockAuthRequestDetail;

      const mockRequest = {
        signature: {
          systemID: {
            toIAddress: () => 'iJhCezBExJHvtyH3fSUwhzybVMVcCL9Gjf',
          },
        },
        details: [mockOrdinalWrapper],
      } as unknown as GenericRequest;

      const mockSignedBy = {
        fullyqualifiedname: 'testuser@',
      } as unknown as Identity;

      const result = extractConsentDataV2(mockRequest, mockSignedBy, 0);

      expect(result.signerFqn).toBe('testuser@');
      expect(result.permissionsLabels).toEqual([]);
      expect(result.systemId).toBe('iJhCezBExJHvtyH3fSUwhzybVMVcCL9Gjf');
      expect(result.constraintsLabels).toEqual([]);
      expect(result.responseURIsLabels).toEqual([]);
      expect(result.expiryLabel).toBeNull();
    });
  });
});
