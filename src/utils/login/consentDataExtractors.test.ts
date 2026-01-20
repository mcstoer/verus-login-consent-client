import {extractConsentDataV1, extractConsentDataV2} from './consentDataExtractors';
import {GenericRequest, LoginConsentRequest} from 'verus-typescript-primitives';
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
        },
      } as unknown as LoginConsentRequest;

      const mockSignedBy = {
        fullyqualifiedname: 'testuser@',
      } as unknown as Identity;

      const result = extractConsentDataV1(mockRequest, mockSignedBy);

      expect(result).toHaveProperty('signerFqn');
      expect(result).toHaveProperty('permissionsText');
      expect(result).toHaveProperty('systemId');
      expect(result.systemId).toBe('iJhCezBExJHvtyH3fSUwhzybVMVcCL9Gjf');
    });

    it('should handle empty requested_access', () => {
      const mockRequest = {
        system_id: 'iJhCezBExJHvtyH3fSUwhzybVMVcCL9Gjf',
        challenge: {
          requested_access: null,
        },
      } as unknown as LoginConsentRequest;

      const mockSignedBy = {
        fullyqualifiedname: 'testuser@',
      } as unknown as Identity;

      const result = extractConsentDataV1(mockRequest, mockSignedBy);

      expect(result.permissionsText).toBe('');
    });
  });

  describe('extractConsentDataV2', () => {
    it('should extract consent data from GenericRequest', () => {
      const mockRequest = {
        signature: {
          systemID: {
            toIAddress: () => 'iJhCezBExJHvtyH3fSUwhzybVMVcCL9Gjf',
          },
        },
      } as unknown as GenericRequest;

      const mockSignedBy = {
        fullyqualifiedname: 'testuser@',
      } as unknown as Identity;

      const result = extractConsentDataV2(mockRequest, mockSignedBy);

      expect(result.signerFqn).toBe('testuser@');
      expect(result.permissionsText).toBe('Authenticate with VerusID');
      expect(result.systemId).toBe('iJhCezBExJHvtyH3fSUwhzybVMVcCL9Gjf');
    });

    it('should handle missing signature', () => {
      const mockRequest = {
        signature: null,
      } as unknown as GenericRequest;

      const mockSignedBy = {
        fullyqualifiedname: 'testuser@',
      } as unknown as Identity;

      const result = extractConsentDataV2(mockRequest, mockSignedBy);

      expect(result.systemId).toBe('');
    });
  });
});
