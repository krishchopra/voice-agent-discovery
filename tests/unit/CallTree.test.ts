import { CallTree } from "../../src/models/CallTree";

describe("CallTree", () => {
	let tree: CallTree;

	beforeEach(() => {
		tree = new CallTree("Initial prompt");
	});

	test("should create root node with initial prompt", () => {
		const root = tree.getRoot();
		expect(root.prompt).toBe("Initial prompt");
		expect(root.id).toBe("0");
		expect(root.visited).toBe(false);
	});

	test("should add child node correctly", () => {
		const childId = tree.addChild("0", "Child prompt");
		const root = tree.getRoot();

		expect(childId).toBe("0-0");
		expect(root.children.length).toBe(1);
		expect(root.children[0].prompt).toBe("Child prompt");
	});

	test("should mark nodes as visited", () => {
		tree.markVisited("0");
		const root = tree.getRoot();
		expect(root.visited).toBe(true);
	});
});
