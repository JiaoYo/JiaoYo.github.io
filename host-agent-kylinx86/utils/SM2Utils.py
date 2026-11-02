from gmssl import sm2, func


class SM2Util:
    def __init__(self, private_key: str, public_key: str, mode=1):
        """
        初始化 SM2 工具
        :param private_key: 64位十六进制私钥字符串
        :param public_key: 128位十六进制公钥字符串（未压缩格式）
        """
        self.private_key = private_key
        self.public_key = public_key
        if not public_key:
            self.sm2_m = sm2.CryptSM2(private_key=private_key, public_key='', mode=mode)
            self.public_key = self.sm2_m._kg(int(private_key, 16), self.sm2_m.ecc_table['g'])
        self.sm2_crypt = sm2.CryptSM2(private_key=self.private_key, public_key=self.public_key, mode=mode)

    @staticmethod
    def generate_keypair() -> dict:
        """
        生成 SM2 密钥对
        :return: 包含 private_key 和 public_key 的字典
        """
        private_key = func.random_hex(64)
        sm2_crypt = sm2.CryptSM2(private_key=private_key, public_key='')
        public_key = sm2_crypt._kg(int(private_key, 16), sm2_crypt.ecc_table['g'])
        return {
            'private_key': private_key,
            'public_key': public_key
        }

    def encrypt_utf8(self, data: str) -> str:
        cipher_bytes = self.sm2_crypt.encrypt(data.encode("utf-8"))
        return "04" + cipher_bytes.hex()

    def encrypt_hex(self, data: str) -> str:
        cipher_bytes = self.sm2_crypt.encrypt(bytes.fromhex(data))
        return "04" + cipher_bytes.hex()

    def encrypt_ascii(self, data: str) -> str:
        cipher_bytes = self.sm2_crypt.encrypt(data.encode("ascii"))
        return "04" + cipher_bytes.hex()

    def decrypt(self, cipher_hex: str) -> bytes:
        if cipher_hex.startswith("04"):
            cipher_text = cipher_hex[2:]
        else:
            cipher_text = cipher_hex
        cipher_bytes = bytes.fromhex(cipher_text)
        plain_bytes = self.sm2_crypt.decrypt(cipher_bytes)
        return plain_bytes

    def sign(self, data_byte: bytes) -> str:
        sign = self.sm2_crypt.sign_with_sm3(data_byte)
        return sign

    def verify(self, signature_hex: str,  data_bytes: bytes) -> bool:
        return self.sm2_crypt.verify_with_sm3(signature_hex, data_bytes)


