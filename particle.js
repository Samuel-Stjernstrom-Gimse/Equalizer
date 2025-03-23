const randomPosition = (canvas) => {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height
    };
};

export default class Particle {
    constructor(size, ctx, canvas) {
        this.size = size;
        this.ctx = ctx;
        this.canvas = canvas;
        this.mass = Math.random() * .12 + 1;
        const { x, y } = randomPosition(canvas);
        this.x = x;
        this.y = y;
        this.velocityX = (Math.random() - 0.5) * 2 / this.mass;
        this.velocityY = 0;
    }

    collision(bars, prevBars) {
        let highestBarUnderParticle = 0;
        let wasPushed = false;

        bars.forEach(({ x, width, height }, i) => {
            const prevHeight = prevBars[i]?.height || 0;

            const isColliding =
                this.x + this.size > x &&
                this.x < x + width &&
                this.y + this.size > this.canvas.height - height;

            const isBarGrowing = height > prevHeight;

            if (isColliding) {
                highestBarUnderParticle = Math.max(highestBarUnderParticle, height);

                if (isBarGrowing) {
                    this.velocityY = -Math.abs(this.velocityY) - (height - prevHeight) * (0.27 / this.mass);
                    this.velocityX += (Math.random() - 0.5) * (2 / this.mass);
                    wasPushed = true;
                }
            }
        });

        const highestPoint = this.canvas.height - highestBarUnderParticle - this.size;
        if (this.y > highestPoint && !wasPushed) {
            this.y = highestPoint;
            this.velocityY = Math.max(this.velocityY, 0);
        }

        this.velocityY += .6 * Math.random() * 1.14; // G
        this.velocityX *= 0.92;
        this.velocityY *= 0.92 / this.mass;

        this.x += this.velocityX;
        this.y += this.velocityY;

        if (this.x < 0 || this.x > this.canvas.width - this.size) this.velocityX *= -1;
        if (this.y > this.canvas.height - this.size) this.velocityY *= -0.5;
    }

    draw() {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}
