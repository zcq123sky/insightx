// 不需要 import，直接使用全局的 crypto 对象

export async function verifyWebhookSignature(
	payloadBody: string,
	signatureHeader: string | undefined,
	secret: string,
): Promise<boolean> {
	if (!signatureHeader) {
		return false;
	}

	// 1. 检查 Header 格式 (GitHub 发送的是 sha256=...)
	if (!signatureHeader.startsWith("sha256=")) {
		return false;
	}
	const signatureHex = signatureHeader.slice(7); // 去掉 "sha256=" 前缀

	// 2. 准备 Key 和 Data (使用 TextEncoder)
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	const data = encoder.encode(payloadBody);

	// 3. 导入 Key
	const key = await crypto.subtle.importKey(
		"raw",
		keyData,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);

	// 4. 计算签名
	const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);

	// 5. 将计算出的签名转为 Hex 字符串
	const computedHex = bufferToHex(signatureBuffer);

	// 6. 定时安全比较 (纯 JS 实现，避免类型报错)
	return timingSafeEqual(signatureHex, computedHex);
}

// 辅助函数：ArrayBuffer 转 Hex 字符串
function bufferToHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

// 辅助函数：定长字符串的定时安全比较 (防止时序攻击)
function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < a.length; i++) {
		// 比较字符的 Unicode 编码
		result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}

	return result === 0;
}
