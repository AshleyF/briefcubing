# Rubiks Connected

https://briefcubing.com/experimental/rubiksconnected/

This cube has the same API as the GoCube.

## Primary Service UUID: 6e400001-b5a3-f393-e0a9-e50e24dcca9e

## Characteristics

Two characteristics. One is notify-only; appearing to publish the cube state. The other is write-only and the purpose is unknown (setting cube state?).

### 6e400003-b5a3-f393-e0a9-e50e24dcca9e

The format seems to always begin with a 0x2A (42) byte, followed by a length (number of bytes to follow). At a fast rate (~20Hz) some kind of pose information is published. The length varies from ~20-30 bytes and is very noisy. It may be pose information or raw accelerometer/gyro, etc.

When a twist is made on the cube, a single 8-byte packet is sent. That is 42, 6, followed by six bytes. The first payload byte has always been observed to be 1. The second seems do be the twist/turn just made:

* B = 0
* B' = 1
* F = 2
* F' = 3
* U = 4
* U' = 5
* D = 6
* D' = 7
* R = 8
* R' = 9
* L = 10
* L' = 11

The next byte changes with each twist, but the meaning is unknown.

The final two bytes have always been observed to be 13, 10 (maybe battery level or some slow-changing value?).

Some samples:

* Solved: 42,6,1,5,0,54,13,10
* U1: 42,6,1,4,3,56,13,10
* U2: 42,6,1,4,6,59,13,10
* U3: 42,6,1,4,9,62,13,10
* U4: 42,6,1,4,0,53,13,10
* R1: 42,6,1,8,3,60,13,10
* R2: 42,6,1,8,6,63,13,10
* R3: 42,6,1,8,9,66,13,10
* R4: 42,6,1,8,0,57,13,10

Notify-only.

* authenticatedSignedWrites: false
* broadcast: false
* indicate: false
* notify: true
* read: false
* reliableWrite: false
* writableAuxiliaries: false
* write: false
* writeWithoutResponse: false

### 6e400002-b5a3-f393-e0a9-e50e24dcca9e

Write-only. No read, no notify.

* authenticatedSignedWrites: false
* broadcast: false
* indicate: false
* notify: false
* read: false
* reliableWrite: false
* writableAuxiliaries: false
* write: true
* writeWithoutResponse: true
