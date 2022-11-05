import React from "react";
import { Flex, Button, Text, Spinner, Badge } from "@chakra-ui/react";

function Header({ connectWallet, disconnectWallet, address, tezBalance }) {
  return (
    <Flex
      justifyContent={"space-between"}
      alignItems="left"
      px={8}
      py={4}
      bgGradient="linear(to-r, #020436, black)"
    >
      <Flex>
        <Text
          bgClip="text"
          fontSize="2xl"
          fontWeight="extrabold"
          bgGradient="linear(to-r, blue.700, blue.400)"
        >
          LevTez
        </Text>
        <Flex >
          <Badge colorScheme="blue" m="11px" rounded="4px" opacity="80%">
            Beta
          </Badge>
        </Flex>
      </Flex>

      <Flex>
        <Button
          onClick={!address ? connectWallet : disconnectWallet}
          colorScheme="blue"
          bgGradient="linear(to-r, blue.700, blue.400)"
          borderRadius={"md"}
          borderRightRadius={address ? 0 : "md"}
        >
          {!address
            ? "Connect Wallet"
            : `${address.slice(0, 4)}...${address.slice(33, 36)}`}
        </Button>
        {address && (
          <Flex>
            <Flex
              borderRadius="md"
              borderLeftRadius={0}
              justifyContent="center"
              alignItems="center"
              px={2}
              bg="blue.400"
            >
              {tezBalance ? (
                <Text color="white" fontWeight={"bold"}>
                  {tezBalance.div(1e6).toNumber().toFixed(2)} XTZ
                </Text>
              ) : (
                <Spinner size="sm" color="blue.700" />
              )}
            </Flex>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}

export default Header;
