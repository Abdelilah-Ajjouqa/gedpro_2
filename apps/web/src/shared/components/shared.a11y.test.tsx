import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { AsyncState } from './async-state';
import { DataTable } from './data-table';

describe('shared component accessibility', () => {
  it('has no detectable violations in representative states', async () => {
    const { container } = render(<><AsyncState kind="empty" title="No results" description="Change the filters." /><DataTable rows={[{ id: 1, name: 'Example' }]} rowKey={(row) => row.id} columns={[{ id: 'name', header: 'Name', cell: (row) => row.name }]} /></>);
    expect((await axe(container)).violations).toEqual([]);
  });
});
