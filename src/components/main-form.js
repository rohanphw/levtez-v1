import React from "react";
import {
  Box,
  SimpleGrid,
  InputGroup,
  Input,
  InputLeftAddon,
  InputRightAddon,
  Button,
  Text,
  UnorderedList,
  ListItem,
  Tooltip,
} from "@chakra-ui/react";

function MainForm({
  setCollateralToAdd,
  setKUSDToBorrow,
  setShowPreview,
  loadingPreview,
  allowPreview,
}) {
  return (
    <Box
      mt={5}
      py={6}
      px={4}
      boxShadow="md"
      borderRadius="10px"
      border={"1px"}
      borderColor="gray.300"
      backgroundColor="blue.900"
    >
      <Box mb={8}>
        <Text fontSize={"xl"} fontWeight="bold" mb={1} color="gray.300">
          Leverage $XTZ
        </Text>
        <Text color="gray.300">In one click -</Text>
        <UnorderedList color="gray.300">
          <ListItem>Add $XTZ collateral</ListItem>
          <ListItem>Borrow $kUSD</ListItem>
          <ListItem>Convert borrowed $kUSD to $XTZ</ListItem>
          <ListItem>Add converted $XTZ as collateral</ListItem>
        </UnorderedList>
      </Box>
      <SimpleGrid columns={2} gap={6}>
        <InputGroup>
          <InputLeftAddon children="Collateral" bgColor="gray.300"/>
          <Tooltip label='Amount to be added as collateral'>
            <Input
              placeholder="$XTZ"
              color="gray.300"
              borderRadius={"sm"}
              onChange={(e) => setCollateralToAdd(e.target.value)}
              type="number"
            />
          </Tooltip>

          <InputRightAddon children="$XTZ" bgColor="gray.300" />
        </InputGroup>
        <InputGroup>
          <InputLeftAddon children="Borrow" bgColor="gray.300"/>
          <Tooltip label='Amount to be borrowed/minted'>
          <Input
            placeholder="$kUSD"
            color="gray.300"
            borderRadius={"sm"}
            onChange={(e) => setKUSDToBorrow(e.target.value)}
            type="number"
          />
          </Tooltip>

          <InputRightAddon children="$kUSD" bgColor="gray.300" />
        </InputGroup>
      </SimpleGrid>

      <Button
        mt={4}
        w="100%"
        colorScheme={"blue"}
        disabled={!allowPreview}
        onClick={() => {
          setShowPreview(true);
        }}
        isLoading={loadingPreview}
        loadingText={"Preparing Preview"}
      >
        Preview Leverage
      </Button>
      <Text fontSize={"sm"} color="gray.300" mt={1}>
        * 1% of XTZ being added as collateral is charged as platform fee.
      </Text>
    </Box>
  );
}

export default MainForm;
