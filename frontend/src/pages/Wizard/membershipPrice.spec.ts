import { calculateMembershipPriceEstimate } from './membershipPrice'

describe('calculateMembershipPriceEstimate', () => {
  it('waits until employee count, salary sum and employee types are filled', () => {
    expect(
      calculateMembershipPriceEstimate({
        employeeCount: 12,
        noEmployees: false,
        employeeTypes: [],
        totalLoensum: 5000000,
        computedMembership: 'Arbejdsgiver',
        selectedFaellesskaber: [],
        selectedServices: [],
      }),
    ).toBeNull()

    expect(
      calculateMembershipPriceEstimate({
        employeeCount: '',
        noEmployees: false,
        employeeTypes: ['funktionaer'],
        totalLoensum: 5000000,
        computedMembership: 'Arbejdsgiver',
        selectedFaellesskaber: [],
        selectedServices: [],
      }),
    ).toBeNull()

    expect(
      calculateMembershipPriceEstimate({
        employeeCount: 12,
        noEmployees: false,
        employeeTypes: ['funktionaer'],
        totalLoensum: '',
        computedMembership: 'Arbejdsgiver',
        selectedFaellesskaber: [],
        selectedServices: [],
      }),
    ).toBeNull()
  })

  it('adds selected communities and association-related services to the estimate', () => {
    const baseEstimate = calculateMembershipPriceEstimate({
      employeeCount: 25,
      noEmployees: false,
      employeeTypes: ['funktionaer'],
      totalLoensum: 10000000,
      computedMembership: 'Arbejdsgiver',
      selectedFaellesskaber: [],
      selectedServices: [],
    })
    const communityEstimate = calculateMembershipPriceEstimate({
      employeeCount: 25,
      noEmployees: false,
      employeeTypes: ['funktionaer'],
      totalLoensum: 10000000,
      computedMembership: 'Arbejdsgiver',
      selectedFaellesskaber: ['di-digital'],
      selectedServices: ['di_byggeri_sektion'],
    })

    expect(baseEstimate).not.toBeNull()
    expect(communityEstimate).not.toBeNull()
    if (!baseEstimate || !communityEstimate) {
      throw new Error('Expected price estimates to be calculated')
    }
    expect(communityEstimate.annualTotal).toBeGreaterThan(baseEstimate.annualTotal)
    expect(communityEstimate.rows).toEqual(
      expect.arrayContaining([
        { label: 'Fællesskaber og foreninger', amount: 6000 },
      ]),
    )
  })
})
