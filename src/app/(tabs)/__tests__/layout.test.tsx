import { describe, expect, jest, test } from '@jest/globals';
import { render } from '@testing-library/react-native';

import TabLayout from '../_layout';

const mockAppTabs = jest.fn(() => null);

jest.mock('@/components/app-tabs', () => ({
  __esModule: true,
  default: () => mockAppTabs(),
}));

describe('TabLayout', () => {
  test('renders the app tabs shell', async () => {
    await render(<TabLayout />);
    expect(mockAppTabs).toHaveBeenCalledTimes(1);
  });
});
