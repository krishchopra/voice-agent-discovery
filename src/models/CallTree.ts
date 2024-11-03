export interface CallNode {
	id: string;
	prompt: string;
	children: CallNode[];
	visited: boolean;
	responses: string[];
	isTerminal: boolean;
}

export class CallTree {
	private root: CallNode;

	constructor(initialPrompt: string) {
		this.root = {
			id: "0",
			prompt: initialPrompt,
			children: [],
			visited: false,
			responses: [],
			isTerminal: false,
		};
	}

	public getRoot(): CallNode {
		return this.root;
	}

	public addResponse(nodeId: string, response: string): void {
		const node = this.findNode(nodeId);
		if (node) {
			node.responses.push(response);
		}
	}

	public addChild(
		parentId: string,
		prompt: string,
		isTerminal = false
	): string {
		const parent = this.findNode(parentId, this.root);
		if (parent) {
			const childId = `${parentId}-${parent.children.length}`;
			parent.children.push({
				id: childId,
				prompt,
				children: [],
				visited: false,
				responses: [],
				isTerminal,
			});
			return childId;
		}
		return "";
	}

	public markVisited(nodeId: string): void {
		const node = this.findNode(nodeId);
		if (node) {
			node.visited = true;
		}
	}

	public getNextUnvisitedNode(): CallNode | null {
		return this.findUnvisitedNode(this.root);
	}

	private findNode(id: string, node: CallNode = this.root): CallNode | null {
		if (node.id === id) {
			return node;
		}

		for (const child of node.children) {
			const found = this.findNode(id, child);
			if (found) {
				return found;
			}
		}

		return null;
	}

	private findUnvisitedNode(node: CallNode): CallNode | null {
		if (!node.visited) {
			return node;
		}

		for (const child of node.children) {
			const unvisited = this.findUnvisitedNode(child);
			if (unvisited) {
				return unvisited;
			}
		}

		return null;
	}

	public printTree(): void {
		console.log("\n=== Voice Agent Conversation Tree ===\n");
		console.log("Depth: 0 = Root, 1 = Follow-up, 2 = Final response\n");
		this.printScenario(this.root, [], "");
	}

	private printScenario(
		node: CallNode,
		visited: string[],
		indent: string
	): void {
		if (visited.includes(node.id)) return;
		visited.push(node.id);

		// show depth level
		const depth = node.id.split("-").length - 1;
		console.log(`${indent}[Depth ${depth}] 🗣️  Agent: "${node.prompt}"`);

		// truncate long responses
		if (node.responses.length > 0) {
			node.responses.forEach((response) => {
				const truncated =
					response.length > 500
						? response.substring(0, 500) + "..."
						: response;
				console.log(`${indent}👤  User: "${truncated}"`);
			});
		}

		if (node.children.length > 0) {
			console.log(`${indent}│`);
			node.children.forEach((child) => {
				this.printScenario(child, [...visited], indent + "  ");
			});
		}
	}

	public getScenarios(): CallNode[][] {
		const scenarios: CallNode[][] = [];
		this.collectScenarios(this.root, [], scenarios);
		return scenarios;
	}

	private collectScenarios(
		node: CallNode,
		currentPath: CallNode[],
		scenarios: CallNode[][]
	) {
		currentPath.push(node);

		if (node.children.length === 0) {
			// leaf node - end of a scenario
			scenarios.push([...currentPath]);
		} else {
			// continue down each child path
			for (const child of node.children) {
				this.collectScenarios(child, [...currentPath], scenarios);
			}
		}
	}
}
