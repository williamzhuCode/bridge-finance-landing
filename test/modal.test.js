import { beforeEach, describe, expect, it } from 'vitest';
import api from '../main.js';
import { loadIndexFixture } from './helpers.js';

const STEP_IDS = ['modal-step-1', 'modal-step-2', 'modal-step-3', 'modal-step-pr'];

function visibleSteps() {
  return STEP_IDS.filter((id) => document.getElementById(id).style.display !== 'none');
}

describe('modal navigation state machine', () => {
  beforeEach(() => {
    loadIndexFixture();
  });

  it('openModal("general") activates the overlay, locks scroll and shows step 1', () => {
    api.openModal('general');
    expect(document.getElementById('modal-overlay').classList.contains('active')).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    expect(visibleSteps()).toEqual(['modal-step-1']);
  });

  it('openModal("property-review") jumps straight to the property-review step', () => {
    api.openModal('property-review');
    expect(visibleSteps()).toEqual(['modal-step-pr']);
  });

  it('closeModal deactivates the overlay and restores scroll', () => {
    api.openModal('general');
    api.closeModal();
    expect(document.getElementById('modal-overlay').classList.contains('active')).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it('showStep keeps exactly one panel visible at a time', () => {
    api.showStep(1);
    expect(visibleSteps()).toEqual(['modal-step-1']);
    api.showStep(2);
    expect(visibleSteps()).toEqual(['modal-step-2']);
  });

  it('hideAllSteps hides every panel', () => {
    api.showStep(1);
    api.hideAllSteps();
    expect(visibleSteps()).toEqual([]);
  });

  it('nextStep records the enquiry type, sets the badge label and advances to step 2', () => {
    api.nextStep('🏠 First Home Buyer');
    expect(api.getEnquiryType()).toBe('🏠 First Home Buyer');
    expect(document.getElementById('modal-type-label').textContent).toBe('🏠 First Home Buyer');
    expect(visibleSteps()).toEqual(['modal-step-2']);
  });
});

describe('overlay click-to-close', () => {
  beforeEach(() => {
    loadIndexFixture();
    api.initModalOverlay();
    api.openModal('general');
  });

  it('closes when the backdrop itself is clicked', () => {
    const overlay = document.getElementById('modal-overlay');
    overlay.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    expect(overlay.classList.contains('active')).toBe(false);
  });

  it('does NOT close when a click originates inside the modal box', () => {
    const overlay = document.getElementById('modal-overlay');
    const box = overlay.querySelector('.modal-box');
    box.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    expect(overlay.classList.contains('active')).toBe(true);
  });
});
