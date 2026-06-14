import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../main.js';
import { loadIndexFixture, setValue } from './helpers.js';

/* Decode the body of a mailto: URL captured from window.open. */
function mailtoParams(url) {
  const query = url.slice(url.indexOf('?') + 1);
  const params = new URLSearchParams(query);
  return { subject: params.get('subject'), body: params.get('body') };
}

describe('submitEnquiry', () => {
  let openSpy;
  let alertSpy;

  beforeEach(() => {
    loadIndexFixture();
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    api.nextStep('💬 General Enquiry');
  });

  it('rejects submission when name and phone are missing', () => {
    api.submitEnquiry();
    expect(alertSpy).toHaveBeenCalledWith('Please fill in your name and phone number.');
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('treats whitespace-only required fields as empty', () => {
    setValue('modal-name', '   ');
    setValue('modal-phone', '\t');
    api.submitEnquiry();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('opens a mailto with the enquiry type and details when valid', () => {
    setValue('modal-name', 'Sarah Chen');
    setValue('modal-phone', '0400 000 000');
    setValue('modal-email', 'sarah@example.com');
    setValue('modal-message', 'Looking to buy in Sydney');
    api.submitEnquiry();

    expect(openSpy).toHaveBeenCalledOnce();
    const [url, target] = openSpy.mock.calls[0];
    expect(url.startsWith('mailto:williamzhu@bridge-finance.com.au?')).toBe(true);
    expect(target).toBe('_blank');

    const { subject, body } = mailtoParams(url);
    expect(subject).toBe('Bridge Finance Enquiry — 💬 General Enquiry');
    expect(body).toContain('Enquiry Type: 💬 General Enquiry');
    expect(body).toContain('Name: Sarah Chen');
    expect(body).toContain('Phone: 0400 000 000');
    expect(body).toContain('Email: sarah@example.com');
    expect(body).toContain('Looking to buy in Sydney');
  });

  it('falls back to "Not provided" for optional email and message', () => {
    setValue('modal-name', 'Sarah Chen');
    setValue('modal-phone', '0400 000 000');
    api.submitEnquiry();
    const { body } = mailtoParams(openSpy.mock.calls[0][0]);
    expect(body).toContain('Email: Not provided');
    expect(body).toContain('Situation:\nNot provided');
  });

  it('safely encodes characters that would otherwise corrupt the mailto query', () => {
    setValue('modal-name', 'A & B');
    setValue('modal-phone', '040');
    setValue('modal-message', 'line1\nline2 & more');
    api.submitEnquiry();
    const url = openSpy.mock.calls[0][0];
    // The raw ampersand must be percent-encoded, not left as a query separator.
    expect(url).not.toContain('& B');
    const { body } = mailtoParams(url);
    expect(body).toContain('Name: A & B');
    expect(body).toContain('line1\nline2 & more');
  });

  it('advances to the thank-you step after a successful send', () => {
    setValue('modal-name', 'Sarah Chen');
    setValue('modal-phone', '0400 000 000');
    api.submitEnquiry();
    expect(document.getElementById('modal-step-3').style.display).toBe('block');
  });
});

describe('submitPropertyReview', () => {
  let openSpy;
  let alertSpy;

  beforeEach(() => {
    loadIndexFixture();
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('requires addresses, name and phone', () => {
    setValue('pr-name', 'Sarah Chen');
    setValue('pr-phone', '0400 000 000');
    // addresses left blank
    api.submitPropertyReview();
    expect(alertSpy).toHaveBeenCalledWith('Please fill in all required fields.');
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('builds a property-analysis mailto when all fields are present', () => {
    setValue('pr-addresses', '12 Smith St Paddington\n45 Jones Ave Chiswick');
    setValue('pr-name', 'Sarah Chen');
    setValue('pr-phone', '0400 000 000');
    api.submitPropertyReview();

    expect(openSpy).toHaveBeenCalledOnce();
    const { subject, body } = mailtoParams(openSpy.mock.calls[0][0]);
    expect(subject).toBe('Free Property Analysis Request — Sarah Chen');
    expect(body).toContain('12 Smith St Paddington');
    expect(body).toContain('45 Jones Ave Chiswick');
    expect(body).toContain('Phone: 0400 000 000');
    expect(document.getElementById('modal-step-3').style.display).toBe('block');
  });
});
