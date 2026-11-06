// @vitest-environment jsdom
import { expect,it } from 'vitest';
import { matchesCheckpoint } from '../src/QrScanner';

it('matches only Hikone2 checkpoint codes, not arbitrary QR URLs',()=>{
 expect(matchesCheckpoint('hikone://checkin/A01','A01')).toBe(true);
 expect(matchesCheckpoint('https://hikone2.vercel.app/?checkin=A01','A01')).toBe(true);
 expect(matchesCheckpoint('https://hikone2.vercel.app/?checkin=A02','A01')).toBe(false);
 expect(matchesCheckpoint('https://hikone-routes.vercel.app/?checkin=A01','A01')).toBe(false);
 expect(matchesCheckpoint('https://evil.example/?checkin=A01','A01')).toBe(false);
 expect(matchesCheckpoint('https://hikone2.vercel.app/?checkin=A01&next=https://evil.example','A01')).toBe(false);
 expect(matchesCheckpoint('http://hikone2.vercel.app/?checkin=A01','A01')).toBe(false);
 expect(matchesCheckpoint('javascript:alert(1)','A01')).toBe(false);
 expect(matchesCheckpoint('A01','A01')).toBe(false);
 expect(matchesCheckpoint('hikone://checkin/A01','../A01')).toBe(false);
});
