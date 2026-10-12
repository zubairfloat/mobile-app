describe("Calculate", () => {
  it("calculate the correct value", () => {
    expect(2+2).toBe(4);
  });
  it("check boolean", () => {
    const data = true;
    expect(data).toBe(true)
  })
  it("check object value", () => {
    const objVal = {"name": "product1", "price": "200"};
    expect(objVal).toEqual({"name": "product1", "price": "200"})
  })
  it("check falsy", () => {
    const value = 1;
    expect(value).toBeTruthy();
  })
});
