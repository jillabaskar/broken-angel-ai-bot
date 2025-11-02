class LudoBoard {
    constructor(scene) {
        this.scene = scene;
        this.boardSize = 15;
        this.cellSize = 1;
        this.pathPositions = this.generatePathPositions();
        this.homePositions = this.generateHomePositions();
        this.winningPositions = this.generateWinningPositions();
        
        this.createBoard();
    }

    generatePathPositions() {
        const positions = [];
        const center = this.boardSize / 2;
        const pathWidth = 3;
        
        // Red player path (starts at bottom)
        // Bottom row going right
        for (let i = 0; i < 6; i++) {
            positions.push({ x: center - pathWidth + 1 + i, z: center + pathWidth });
        }
        // Turn up
        for (let i = 1; i <= pathWidth; i++) {
            positions.push({ x: center + pathWidth, z: center + pathWidth - i });
        }
        // Right column going up
        for (let i = 1; i < 6; i++) {
            positions.push({ x: center + pathWidth, z: center - i });
        }
        
        // Blue player section (top)
        // Turn left at top
        for (let i = 1; i <= pathWidth; i++) {
            positions.push({ x: center + pathWidth - i, z: center - 6 });
        }
        // Top row going left
        for (let i = 1; i < 6; i++) {
            positions.push({ x: center - i, z: center - 6 });
        }
        // Turn down
        for (let i = 1; i <= pathWidth; i++) {
            positions.push({ x: center - 6, z: center - 6 + i });
        }
        
        // Green player section (left)
        // Left column going down
        for (let i = 1; i < 6; i++) {
            positions.push({ x: center - 6, z: center + i });
        }
        // Turn right at bottom
        for (let i = 1; i <= pathWidth; i++) {
            positions.push({ x: center - 6 + i, z: center + pathWidth });
        }
        // Bottom row going right (before red start)
        for (let i = 1; i < 6; i++) {
            positions.push({ x: center - pathWidth + i, z: center + pathWidth });
        }
        
        // Yellow player section (right side, completing the loop)
        // Turn up
        for (let i = 1; i <= pathWidth; i++) {
            positions.push({ x: center + pathWidth, z: center + pathWidth - i });
        }
        
        return positions;
    }

    generateHomePositions() {
        const center = this.boardSize / 2;
        const homeOffset = 5;
        
        return {
            0: [ // Red - bottom left
                { x: center - homeOffset, z: center + homeOffset },
                { x: center - homeOffset + 1.5, z: center + homeOffset },
                { x: center - homeOffset, z: center + homeOffset - 1.5 },
                { x: center - homeOffset + 1.5, z: center + homeOffset - 1.5 }
            ],
            1: [ // Blue - top left
                { x: center - homeOffset, z: center - homeOffset },
                { x: center - homeOffset + 1.5, z: center - homeOffset },
                { x: center - homeOffset, z: center - homeOffset + 1.5 },
                { x: center - homeOffset + 1.5, z: center - homeOffset + 1.5 }
            ],
            2: [ // Green - top right
                { x: center + homeOffset, z: center - homeOffset },
                { x: center + homeOffset - 1.5, z: center - homeOffset },
                { x: center + homeOffset, z: center - homeOffset + 1.5 },
                { x: center + homeOffset - 1.5, z: center - homeOffset + 1.5 }
            ],
            3: [ // Yellow - bottom right
                { x: center + homeOffset, z: center + homeOffset },
                { x: center + homeOffset - 1.5, z: center + homeOffset },
                { x: center + homeOffset, z: center + homeOffset - 1.5 },
                { x: center + homeOffset - 1.5, z: center + homeOffset - 1.5 }
            ]
        };
    }

    generateWinningPositions() {
        const center = this.boardSize / 2;
        
        return {
            0: [ // Red - path to center from bottom
                { x: center - 2, z: center + 2 },
                { x: center - 2, z: center + 1 },
                { x: center - 2, z: center },
                { x: center - 2, z: center - 1 },
                { x: center - 2, z: center - 2 }
            ],
            1: [ // Blue - path to center from top
                { x: center - 2, z: center - 2 },
                { x: center - 1, z: center - 2 },
                { x: center, z: center - 2 },
                { x: center + 1, z: center - 2 },
                { x: center + 2, z: center - 2 }
            ],
            2: [ // Green - path to center from right
                { x: center + 2, z: center - 2 },
                { x: center + 2, z: center - 1 },
                { x: center + 2, z: center },
                { x: center + 2, z: center + 1 },
                { x: center + 2, z: center + 2 }
            ],
            3: [ // Yellow - path to center from left
                { x: center + 2, z: center + 2 },
                { x: center + 1, z: center + 2 },
                { x: center, z: center + 2 },
                { x: center - 1, z: center + 2 },
                { x: center - 2, z: center + 2 }
            ]
        };
    }

    createBoard() {
        // Base board
        const boardGeometry = new THREE.BoxGeometry(this.boardSize, 0.5, this.boardSize);
        const boardMaterial = new THREE.MeshPhongMaterial({ color: 0xf5f5dc });
        const board = new THREE.Mesh(boardGeometry, boardMaterial);
        board.position.y = -0.25;
        board.receiveShadow = true;
        this.scene.add(board);

        // Create path cells
        this.pathPositions.forEach((pos, index) => {
            this.createCell(pos.x, pos.z, 0xffffff, false);
        });

        // Create home areas
        const colors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f];
        Object.keys(this.homePositions).forEach(playerId => {
            const homeArea = this.homePositions[playerId];
            homeArea.forEach(pos => {
                this.createCell(pos.x, pos.z, colors[playerId], true);
            });
        });

        // Create winning paths
        Object.keys(this.winningPositions).forEach(playerId => {
            const winPath = this.winningPositions[playerId];
            winPath.forEach(pos => {
                this.createCell(pos.x, pos.z, colors[playerId], false, 0.3);
            });
        });

        // Create center winning area
        const centerGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.6, 32);
        const centerMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.set(this.boardSize / 2, 0.3, this.boardSize / 2);
        center.castShadow = true;
        this.scene.add(center);

        // Add star decoration on center
        const starGeometry = new THREE.ConeGeometry(0.5, 0.8, 4);
        const starMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.position.set(this.boardSize / 2, 0.9, this.boardSize / 2);
        star.rotation.y = Math.PI / 4;
        this.scene.add(star);

        // Create safe zone markers (stars)
        const safeZones = [0, 8, 13, 21, 26, 34, 39, 47]; // Safe positions on the path
        safeZones.forEach(index => {
            if (this.pathPositions[index]) {
                const pos = this.pathPositions[index];
                const safeMarker = new THREE.Mesh(
                    new THREE.ConeGeometry(0.2, 0.3, 4),
                    new THREE.MeshPhongMaterial({ color: 0xffffff })
                );
                safeMarker.position.set(pos.x, 0.4, pos.z);
                safeMarker.rotation.y = Math.PI / 4;
                this.scene.add(safeMarker);
            }
        });
    }

    createCell(x, z, color, isHome, height = 0.1) {
        const cellGeometry = new THREE.BoxGeometry(
            this.cellSize * 0.9, 
            height, 
            this.cellSize * 0.9
        );
        const cellMaterial = new THREE.MeshPhongMaterial({ 
            color: color,
            transparent: isHome,
            opacity: isHome ? 0.3 : 1
        });
        const cell = new THREE.Mesh(cellGeometry, cellMaterial);
        cell.position.set(x, height / 2, z);
        cell.castShadow = true;
        cell.receiveShadow = true;
        this.scene.add(cell);

        // Add border
        const borderGeometry = new THREE.EdgesGeometry(cellGeometry);
        const borderMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        border.position.copy(cell.position);
        this.scene.add(border);
    }

    getPathPosition(index) {
        if (index >= 0 && index < this.pathPositions.length) {
            return this.pathPositions[index];
        }
        return null;
    }

    getHomePosition(playerId, pieceIndex) {
        return this.homePositions[playerId][pieceIndex];
    }

    getWinningPosition(playerId, index) {
        if (index >= 0 && index < this.winningPositions[playerId].length) {
            return this.winningPositions[playerId][index];
        }
        return null;
    }
}
