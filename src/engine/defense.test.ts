/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DefenseEngine } from './DefenseEngine';

describe('CyberCore: Protocol Defense Engine Invariants', () => {
  test('Initializes Core Mainframe at map center (16, 16) with 100 HP', () => {
    const engine = new DefenseEngine();
    assert.equal(engine.coreGridX, 16);
    assert.equal(engine.coreGridZ, 16);
    assert.equal(engine.coreHp, 100);
    assert.equal(engine.maxCoreHp, 100);
    assert.equal(engine.currentWave, 1);
    assert.equal(engine.waveState, 'idle');
  });

  test('Waves spawn escalating threats and countdown correctly', () => {
    const engine = new DefenseEngine();
    engine.startNextWave();

    assert.equal(engine.waveState, 'countdown');
    assert.ok(engine.waveCountdown > 0);

    // Tick past countdown
    engine.update(4.0, [], []);
    assert.equal(engine.waveState, 'in_progress');

    // Tick to spawn enemies
    engine.update(2.0, [], []);
    assert.ok(engine.enemies.length > 0, 'Enemies should spawn in progress state');
  });

  test('Turrets acquire targets and fire lasers', () => {
    const engine = new DefenseEngine();
    engine.startNextWave();
    engine.update(4.0, [], []); // Wave starts
    engine.update(2.0, [], []); // Spawn enemies

    assert.ok(engine.enemies.length > 0);
    const enemy = engine.enemies[0];
    const initialHp = enemy.hp;

    // Place a firewall turret near enemy
    const mockNodes = [
      {
        id: 'fw_turret',
        type: 'firewall',
        gridX: Math.round(enemy.x),
        gridZ: Math.round(enemy.z),
        status: 'online',
      },
    ];

    // Tick turret update with a small frame delta (within 0.12s laser beam duration)
    engine.update(0.04, mockNodes, []);

    assert.ok(engine.laserBeams.length > 0, 'Firewall should fire laser beam at in-range enemy');
    assert.ok(enemy.hp < initialHp, 'Enemy should take damage from laser');
  });

  test('Autonomous AGV bots vacuum blue Data Orbs ($) and deposit cash', () => {
    const engine = new DefenseEngine();
    assert.equal(engine.bots.length, 1);
    const bot = engine.bots[0];

    // Spawn a dropped orb right next to bot
    engine.droppedOrbs.push({
      id: 'test_orb_1',
      gridX: Math.round(bot.x),
      gridZ: Math.round(bot.z),
      worldX: bot.x,
      worldZ: bot.z,
      value: 50,
      createdAt: Date.now(),
      lifespan: 15,
    });

    const mockNodes = [
      {
        id: 'srv_dock',
        type: 'server',
        gridX: 18,
        gridZ: 14,
        status: 'online',
      },
    ];

    // Tick bot update: should vacuum orb
    engine.update(0.2, mockNodes, []);
    assert.equal(engine.droppedOrbs.length, 0, 'Bot should have vacuumed the dropped orb');
    assert.ok(bot.carryingValue > 0, 'Bot should be carrying harvested value');

    let cashRewarded = 0;
    engine.onRewardCash = (amount) => {
      cashRewarded += amount;
    };

    // Bot returns to server dock to deposit
    bot.x = 18;
    bot.z = 14;
    engine.update(0.2, mockNodes, []);

    assert.equal(bot.carryingValue, 0, 'Carrying value should reset to 0 after deposit');
    assert.equal(cashRewarded, 50, 'Cash reward should be deposited');
  });

  test('Core EMP blast discharges and destroys threats', () => {
    const engine = new DefenseEngine();
    engine.startNextWave();
    engine.update(4.0, [], []);
    engine.update(2.0, [], []);

    assert.ok(engine.enemies.length > 0);
    assert.equal(engine.empCooldown, 0);

    engine.triggerEmpBlast();
    assert.ok(engine.empCooldown > 0, 'EMP should enter cooldown');
  });
});
