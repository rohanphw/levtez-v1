import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  SimpleGrid,
  Stat,
  StatNumber,
  StatLabel,
  StatHelpText,
  Skeleton,
} from "@chakra-ui/react";

function Oven({ address, data }) {
  const [allGood, setAllGood] = useState(false);
  const [collateral, setCollateral] = useState(0);
  const [collateralUSD, setCollateralUSD] = useState(0);
  const [borrowed, setBorrowed] = useState(0);
  const [borrowedUSD, setBorrowedUSD] = useState(0);

  const [ratio, setRatio] = useState(0);
  const [utilization, setUtilization] = useState(0);
  const [liqPrice, setLiqPrice] = useState(0);

  useEffect(() => {
    setAllGood(false);
    if (data) {
      let coll = data.collateral.div(1e6);
      let borrow = data.borrowed.div(1e18);
      setCollateral(coll.toNumber());
      setBorrowed(borrow.toNumber());

      let collateralUSD = coll.times(data.usd.tez);
      setCollateralUSD(collateralUSD.toNumber());

      let borrowedUSD = borrow.times(data.usd.kusd);
      setBorrowedUSD(borrowedUSD.toNumber());

      setRatio(
        collateralUSD.div(borrowedUSD).times(100).toNumber()
          ? collateralUSD.div(borrowedUSD).times(100).toNumber()
          : 0
      );
      setUtilization(
        borrowedUSD.div(collateralUSD.div(2)).times(100).toNumber()
          ? borrowedUSD.div(collateralUSD.div(2)).times(100).toNumber()
          : 0
      );
      setLiqPrice(
        borrowedUSD.times(2).div(coll).toNumber()
          ? borrowedUSD.times(2).div(coll).toNumber()
          : 0
      );
      setAllGood(true);
    }
  }, [data]);

  return (
    <Box
      mt={5}
      borderRadius={"10px"}
      boxShadow="md"
      border={"1px"}
      borderColor="gray.300"
      backgroundColor="blue.900"
    >
      <Flex
        p={4}
        bgGradient={"linear(to-r, blue.100, blue.300)"}
        borderTopLeftRadius={"10px"}
        borderTopEndRadius={"10px"}
      >
        <Text fontSize={"lg"} fontWeight={"semibold"}>
          Oven Address -<br/> {address}
        </Text>
      </Flex>

      <SimpleGrid
        px={4}
        py={6}
        columns={3}
        gap={5}
        spacing={6}
        minChildWidth="120px"
        color="gray.300"
      >
        <Stat p={2}>
          <StatLabel color="gray.300">Collateral</StatLabel>
          <Skeleton isLoaded={allGood} startColor='blue.700' endColor='blue.900' rounded='5px' marginTop='2px'>
            <StatNumber>{collateral.toFixed(2)} XTZ</StatNumber>
            <StatHelpText>${collateralUSD.toFixed(2)}</StatHelpText>
          </Skeleton>
        </Stat>
        <Stat p={2}>
          <StatLabel>Debt</StatLabel>
          <Skeleton isLoaded={allGood} startColor='blue.700' endColor='blue.900' rounded='5px' marginTop='2px'>
            <StatNumber>{borrowed.toFixed(2)} kUSD</StatNumber>
            <StatHelpText>${borrowedUSD.toFixed(2)}</StatHelpText>
          </Skeleton>
        </Stat>
        <Stat p={2}>
          <StatLabel>Collateralisation Ratio</StatLabel>
          <Skeleton isLoaded={allGood} startColor='blue.700' endColor='blue.900' rounded='5px' marginTop='2px'>
            <StatNumber>{ratio.toFixed(2)}%</StatNumber>
            <StatHelpText>Safe above: 200%</StatHelpText>
          </Skeleton>
        </Stat>
        <Stat p={2}>
          <StatLabel>Collateral Utilization</StatLabel>
          <Skeleton isLoaded={allGood} startColor='blue.700' endColor='blue.900' rounded='5px' marginTop='2px'>
            <StatNumber>{utilization.toFixed(2)}%</StatNumber>
            <StatHelpText>Safe upto 80%</StatHelpText>
          </Skeleton>
        </Stat>
        <Stat p={2}>
          <StatLabel>Liquidation Price</StatLabel>
          <Skeleton isLoaded={allGood} startColor='blue.700' endColor='blue.900' rounded='5px' marginTop='2px'>
            <StatNumber>1 XTZ = ${liqPrice.toFixed(2)}</StatNumber>
          </Skeleton>
        </Stat>
      </SimpleGrid>
    </Box>
  );
}

export default Oven;
