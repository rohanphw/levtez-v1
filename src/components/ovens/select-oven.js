import React from "react";
import { Box, Button, SimpleGrid, Text, Link, Flex } from "@chakra-ui/react";

import Oven from "./oven-option";

function SelectOven({ ovens, setSelected, afterSelect }) {
  return (
    <Box
      p={8}
      borderRadius={"10px"}
      boxShadow="sm"
      border={"1px"}
      borderColor="gray.300"
      
      maxW={"container.md"}
      mx={"auto"}
      backgroundColor="#01021f"
    >
      <Box fontSize={"2xl"} fontWeight={"bold"} pb={8}>
        <Text color="gray.300">Select Oven</Text>
      </Box>

      {ovens.length ? (
        <SimpleGrid spacing={4}>
          {ovens.map((o) => (
            <button
              key={o}
              onClick={() => {
                setSelected(o);
                afterSelect();
              }}
            >
              <Oven oven={o} />
            </button>
          ))}
          <Text align="center" color="gray.300" fontSize="xl">
            {" "}
            Or
          </Text>
          <Flex align="center" justifyContent="center">
            <Link href="https://kolibri.finance" target={"_blank"}>
              <Button backgroundColor="blue.200" size="md">
                Create new Oven
              </Button>
            </Link>
          </Flex>
        </SimpleGrid>
      ) : (
        "loading"
      )}
    </Box>
  );
}

export default SelectOven;
