function encodeVarint(value: number): number[] {
  const bytes = []
  while (value >= 0x80) {
    bytes.push((value & 0x7f) | 0x80)
    value >>>= 7
  }
  bytes.push(value)
  return bytes
}

export function lightMapFixture(values = new Uint8Array([1, 2, 3, 255, 0, 2, 2, 2])): ArrayBuffer {
  const runs: number[] = []
  for (let index = 0; index < values.length;) {
    let end = index + 1
    while (end < values.length && values[end] === values[index]) end += 1
    runs.push(...encodeVarint(end - index), values[index])
    index = end
  }
  const buffer = new ArrayBuffer(36 + runs.length)
  const bytes = new Uint8Array(buffer)
  bytes.set(new TextEncoder().encode('SPICALP1'))
  const view = new DataView(buffer)
  view.setUint16(8, 4, true)
  view.setUint16(10, 2, true)
  view.setFloat32(12, -180, true)
  view.setFloat32(16, 90, true)
  view.setFloat32(20, 90, true)
  view.setFloat32(24, -3, true)
  view.setFloat32(28, 2, true)
  view.setUint32(32, values.length, true)
  bytes.set(runs, 36)
  return buffer
}
